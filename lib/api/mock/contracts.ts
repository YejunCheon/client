import { mockContracts } from '@/mocks/data/contracts';
import type {
  ContractCreateRequest,
  ContractCreateResponse,
  ContractData,
  ContractDeleteResponse,
  ContractListItem,
  ContractListResponse,
  ContractSignRequest,
  ContractSignResponse,
  ContractStatus,
  ContractUploadPayload,
  ContractUploadResponse,
} from '@/types/contract';
import type { ContractsApi } from '../types';
import { generateId, respond } from './utils';

const contractDocuments = new Map<string | number, Blob>();

function createAiContractData(
  payload: ContractCreateRequest
): ContractData {
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

function findContract(
  contractId: string | number
): ContractListItem | undefined {
  return mockContracts.find((contract) => contract.id === contractId);
}

function updateContractStatus(
  contractId: string | number,
  status: ContractStatus
) {
  const contract = findContract(contractId);
  if (contract) {
    contract.status = status;
    contract.updatedAt = new Date().toISOString();
  }
}

export function createMockContractsApi(): ContractsApi {
  return {
    async list(): Promise<ContractListResponse> {
      return respond({
        contracts: mockContracts.map((contract) => ({ ...contract })),
        success: true,
        count: mockContracts.length,
      });
    },

    async create(
      payload: ContractCreateRequest
    ): Promise<ContractCreateResponse> {
      const contractId = generateId('contract');
      const data = createAiContractData(payload);

      const newContract: ContractListItem = {
        id: contractId,
        roomId: payload.roomId,
        sellerId: payload.sellerId,
        buyerId: payload.buyerId,
        productId: undefined,
        summary: `Room ${payload.roomId} 계약 초안`,
        status: ContractStatus.DRAFT,
        updatedAt: new Date().toISOString(),
      };

      mockContracts.unshift(newContract);

      return respond({
        isSuccess: true,
        data,
        message: 'AI 계약서가 생성되었습니다.',
      });
    },

    async sign(
      payload: ContractSignRequest
    ): Promise<ContractSignResponse> {
      const contract = mockContracts.find(
        (item) => item.productId === payload.productId
      );

      if (contract) {
        updateContractStatus(contract.id, ContractStatus.SIGNED);
      }

      return respond({
        isSuccess: true,
        data: `room:${payload.roomId}`,
        isBothSigned: true,
        message: '서명이 완료되었습니다.',
      });
    },

    async upload(
      payload: ContractUploadPayload
    ): Promise<ContractUploadResponse> {
      const contractId = generateId('upload');
      contractDocuments.set(contractId, payload.pdf);

      const response: ContractUploadResponse = {
        success: true,
        message: '계약서 PDF가 업로드되었습니다.',
        contractId,
        filePath: `/uploads/contracts/${contractId}.pdf`,
        sellerId: payload.sellerId,
        buyerId: payload.buyerId,
        roomId: payload.roomId,
        encryptedHash: generateId('hash'),
      };

      return respond(response);
    },

    async download(contractId: number | string): Promise<Blob> {
      if (contractDocuments.has(contractId)) {
        return respond(contractDocuments.get(contractId)!);
      }

      const contract = findContract(contractId);
      const blob = new Blob(
        [
          `Mock contract document for ${contractId}\n`,
          JSON.stringify(contract ?? { id: contractId }, null, 2),
        ],
        { type: 'application/pdf' }
      );

      contractDocuments.set(contractId, blob);
      return respond(blob);
    },

    async delete(
      contractId: number | string
    ): Promise<ContractDeleteResponse> {
      const index = mockContracts.findIndex(
        (contract) => contract.id === contractId
      );

      if (index === -1) {
        return respond({
          success: false,
          message: '계약서를 찾을 수 없습니다.',
          contractId: Number(contractId),
        });
      }

      mockContracts.splice(index, 1);
      contractDocuments.delete(contractId);

      return respond({
        success: true,
        message: '계약서가 삭제되었습니다.',
        contractId: Number(contractId),
      });
    },
  };
}
