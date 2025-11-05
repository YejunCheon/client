import { mockContracts } from '@/mocks/data/contracts';
import type {
  ContractCreateRequest,
  ContractCreateResponse,
  ContractData,
  ContractDeleteResponse,
  ContractDetailParams,
  ContractDetailResponse,
  ContractEditRequest,
  ContractListItem,
  ContractListResponse,
  ContractRejectRequest,
  ContractSearchRequest,
  ContractSearchResponse,
  ContractSendRequest,
  ContractSendResponse,
  ContractSignRequest,
  ContractSignResponse,
  ContractStatus,
  ContractUploadPayload,
  ContractUploadResponse,
  EntityId,
} from '@/types/contract';
import type { ContractsApi } from '../types';
import { generateId, respond } from './utils';

const contractDocuments = new Map<EntityId, Blob>();

function createAiContractData(payload: ContractCreateRequest): ContractData {
  return {
    parties: {
      sellerName: `판매자 #${payload.sellerId}`,
      buyerName: `구매자 #${payload.buyerId}`,
    },
    item: {
      name: `Product for room ${payload.roomId}`,
      condition: '새상품과 유사',
    },
    payment: {
      price: '100000',
      method: '무통장 입금',
    },
    delivery: {
      method: '택배',
      dateTime: new Date().toISOString(),
      location: '서울특별시 중구 을지로 100',
    },
    specialTerms: '특약사항 없음',
  };
}

function findContractById(contractId: EntityId): ContractListItem | undefined {
  return mockContracts.find(
    (contract) =>
      contract.id === contractId ||
      contract.contractId === contractId
  );
}

function findContractByRoom(roomId: string): ContractListItem | undefined {
  return mockContracts.find((contract) => contract.roomId === roomId);
}

function updateContractStatus(contractId: EntityId, status: ContractStatus) {
  const target = findContractById(contractId);
  if (target) {
    target.status = status;
    target.updatedAt = new Date().toISOString();
  }
}

function ensureContractBlob(contractId: EntityId): Blob {
  if (contractDocuments.has(contractId)) {
    return contractDocuments.get(contractId)!;
  }

  const contract = findContractById(contractId);
  const blob = new Blob(
    [
      `Mock contract document for ${contractId}\n`,
      JSON.stringify(contract ?? { id: contractId }, null, 2),
    ],
    { type: 'application/pdf' }
  );

  contractDocuments.set(contractId, blob);
  return blob;
}

export function createMockContractsApi(): ContractsApi {
  return {
    async list(params): Promise<ContractListResponse> {
      const filtered = params?.roomId
        ? mockContracts.filter((contract) => contract.roomId === params.roomId)
        : mockContracts;

      return respond({
        contracts: filtered.map((contract) => ({ ...contract })),
        success: true,
        count: filtered.length,
      });
    },

    async create(payload: ContractCreateRequest): Promise<ContractCreateResponse> {
      const contractId = generateId('contract');
      const data = createAiContractData(payload);

      const newContract: ContractListItem = {
        id: contractId,
        contractId,
        roomId: payload.roomId,
        sellerId: payload.sellerId,
        buyerId: payload.buyerId,
        productId: undefined,
        summary: `Room ${payload.roomId} 계약 초안`,
        status: ContractStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockContracts.unshift(newContract);

      return respond({
        isSuccess: true,
        data,
        summary: '생성된 계약서 요약입니다.',
        message: 'AI 계약서가 생성되었습니다.',
      });
    },

    async sign(payload: ContractSignRequest): Promise<ContractSignResponse> {
      const contract =
        findContractByRoom(payload.roomId ?? '') ??
        mockContracts.find((item) => item.productId === payload.productId);

      if (contract) {
        updateContractStatus(contract.contractId ?? contract.id, ContractStatus.SIGNED);
      }

      return respond({
        isSuccess: true,
        data: `room:${payload.roomId}`,
        bothSign: true,
        message: '서명이 완료되었습니다.',
      });
    },

    async search(payload: ContractSearchRequest): Promise<ContractSearchResponse> {
      const contract = findContractByRoom(payload.roomId);
      const data = contract
        ? createAiContractData({
            roomId: payload.roomId,
            sellerId: payload.sellerId,
            buyerId: payload.buyerId,
          })
        : {};

      return respond({
        isSuccess: true,
        data,
        summary: contract?.summary ?? '요약 정보가 존재하지 않습니다.',
      });
    },

    async reject(payload: ContractRejectRequest): Promise<ContractSendResponse> {
      const contract = findContractByRoom(payload.roomId);
      if (contract) {
        updateContractStatus(contract.contractId ?? contract.id, ContractStatus.VOID);
      }

      return respond({
        isSuccess: true,
        data: '계약서가 거절되었습니다.',
        bothSign: false,
      });
    },

    async edit(payload: ContractEditRequest): Promise<ContractSearchResponse> {
      const contract = findContractByRoom(payload.roomId);
      if (contract) {
        contract.summary = '수정된 계약서 요약입니다.';
        contract.updatedAt = new Date().toISOString();
      }

      return respond({
        isSuccess: true,
        data: payload.contract ?? {},
        summary: contract?.summary ?? '수정된 계약서 요약입니다.',
      });
    },

    async send(payload: ContractSendRequest): Promise<ContractSendResponse> {
      const contract = findContractByRoom(payload.roomId);
      if (contract) {
        updateContractStatus(
          contract.contractId ?? contract.id,
          ContractStatus.SELLER_REVIEW
        );
      }

      return respond({
        isSuccess: true,
        data: '계약서가 전송되었습니다.',
        bothSign: false,
      });
    },

    async detail(params: ContractDetailParams): Promise<ContractDetailResponse> {
      const contract = findContractByRoom(params.roomId);
      if (params.responseType === 'json') {
        return respond({
          isSuccess: true,
          data: contract ?? {},
          summary: contract?.summary ?? '계약서 요약이 없습니다.',
        });
      }

      const targetId = contract?.contractId ?? contract?.id ?? params.roomId;
      return respond(ensureContractBlob(targetId));
    },

    async upload(payload: ContractUploadPayload): Promise<ContractUploadResponse> {
      const contractId = generateId('upload');
      contractDocuments.set(contractId, payload.pdf);

      return respond({
        success: true,
        message: '계약서 PDF가 업로드되었습니다.',
        contractId,
        filePath: `/uploads/contracts/${contractId}.pdf`,
        sellerId: payload.sellerId,
        buyerId: payload.buyerId,
        roomId: payload.roomId,
        encryptedHash: generateId('hash'),
      });
    },

    async delete(contractId: number | string): Promise<ContractDeleteResponse> {
      const index = mockContracts.findIndex(
        (contract) => contract.id === contractId || contract.contractId === contractId
      );

      if (index === -1) {
        return respond({
          success: false,
          message: '계약서를 찾을 수 없습니다.',
          contractId: contractId,
        });
      }

      const [removed] = mockContracts.splice(index, 1);
      contractDocuments.delete(removed.contractId ?? removed.id);

      return respond({
        success: true,
        message: '계약서가 삭제되었습니다.',
        contractId: removed.contractId ?? removed.id,
      });
    },
  };
}
