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
  BuyerContractDetailRequest,
  BuyerContractDetailResponse,
  BuyerContractAcceptRequest,
  BuyerContractAcceptResponse,
  BuyerContractRejectRequest,
  BuyerContractRejectResponse,
} from '@/types/contract';
import type { ContractsApi } from '../types';
import { generateId, respond } from './utils';

const contractDocuments = new Map<EntityId, Blob>();

function createAiContractData(payload: ContractCreateRequest): ContractData {
  return {
    parties: {
      seller: {
        address: '서울특별시 중구 을지로 100',
        name: `판매자 #${payload.sellerId}`,
        phone: '010-1234-5678',
      },
      buyer: {
        address: '서울특별시 강남구 테헤란로 200',
        name: `구매자 #${payload.buyerId}`,
        phone: '010-9876-5432',
      },
    },
    item_details: {
      name: '리코 GR3 디지털 카메라',
      condition_and_info: '우측 상단의 작은 기스, 1200 셔터 수, 23년 구입',
    },
    payment: {
      price: '1,000,000원',
      price_method: '계약금 300,000원, 잔금 700,000원',
      payment_method: '매도인의 계좌(국민은행 0000-1234-5678)로 계좌이체',
      payment_schedule: '계약금은 계약 체결 시, 잔금은 배송 완료 후 3일 이내',
    },
    delivery: {
      method: '우체국 택배',
      schedule: '2일 안에 우체국으로 송부',
    },
    escrow: {
      details: '청약철회는 계약 체결 후 7일 이내 가능하며, 계약해제는 상대방의 동의가 필요합니다.',
    },
    cancellation_policy: {
      details: '매도인 또는 매수인이 계약을 미이행할 경우, 상대방은 계약 해제 및 손해배상을 청구할 수 있습니다.',
    },
    refund_policy: {
      details: '계약내용과 일치하는 한 단순 변심에 의한 반품 및 교환 불가능',
    },
    dispute_resolution: {
      details: '분쟁 발생 시, 당사자 간 협의를 우선하며, 합의가 이루어지지 않을 경우 관할 법원에 제소할 수 있습니다.',
    },
    other_terms: {
      technical_specs: '카메라',
      general_terms: '기타 특별한 약정사항 없음',
    },
    contract_date: new Date().toISOString().split('T')[0],
    title: `상품 거래 계약서 - Room ${payload.roomId}`,
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

    // Buyer signing flow
    async buyerDetail(payload: BuyerContractDetailRequest): Promise<BuyerContractDetailResponse> {
      const contract = findContractByRoom(payload.roomId);

      if (!contract) {
        return respond({
          isSuccess: false,
          contractResponseDto: { contract: {} as ContractData },
          rationaleResponseDto: { rational: {} },
          message: '계약서를 찾을 수 없습니다.',
        });
      }

      const contractData = createAiContractData({
        roomId: payload.roomId,
        sellerId: contract.sellerId,
        buyerId: payload.buyerId,
      });

      const rationale = {
        item_details: '정확한 모델명과 상태를 기재하여 거래 품목을 명확히 식별하고 향후 분쟁을 예방합니다.',
        payment: '매매금액, 지불 방법, 시기를 명확히 하여 거래의 투명성을 보장합니다.',
        delivery: '거래 방법과 시기를 구체적으로 명시하여 분쟁을 예방합니다.',
        cancellation_policy: '계약 미이행 시 책임과 보상 방법을 명확히 규정하여 법적 분쟁을 최소화합니다.',
        escrow: '청약철회 및 계약해제 조건을 명확히 하여 소비자 권익을 보호합니다.',
        refund_policy: '반품 및 교환 정책을 명시하여 향후 분쟁을 방지합니다.',
        dispute_resolution: '분쟁 발생 시 해결 절차를 명시하여 신속한 해결을 도모합니다.',
        other_terms: '기타 특별한 약정사항을 명시하여 계약의 완전성을 확보합니다.',
      };

      const summary = `${contractData.item_details.name} 거래 계약서입니다. 매매금액은 ${contractData.payment.price}이며, ${contractData.delivery.method}로 ${contractData.delivery.schedule} 거래됩니다. 반품 및 교환은 계약내용과 일치하는 한 불가능합니다.`;

      const evidence = `본 계약서는 매도인과 매수인 간의 합의에 따라 작성되었으며, 다음과 같은 법적 근거를 따릅니다:\n\n1. 민법 제563조 - 매도인의 하자담보책임\n2. 전자상거래 등에서의 소비자보호에 관한 법률 제17조 - 청약철회\n3. 민법 제544조 - 계약해제의 효과\n\n이 계약서는 양 당사자의 서명으로 법적 효력이 발생합니다.`;

      return respond({
        isSuccess: true,
        contractResponseDto: { contract: contractData },
        rationaleResponseDto: { rational: rationale },
        summary,
        evidence,
      });
    },

    async buyerAccept(payload: BuyerContractAcceptRequest): Promise<BuyerContractAcceptResponse> {
      const contract = findContractByRoom(payload.roomId);

      if (!contract) {
        return respond({
          isSuccess: false,
          message: '계약서를 찾을 수 없습니다.',
        });
      }

      updateContractStatus(contract.contractId ?? contract.id, ContractStatus.SIGNED);

      return respond({
        isSuccess: true,
        data: '계약이 체결되었습니다.',
        message: '구매자의 서명이 완료되어 계약이 체결되었습니다.',
      });
    },

    async buyerReject(payload: BuyerContractRejectRequest): Promise<BuyerContractRejectResponse> {
      const contract = findContractByRoom(payload.roomId);

      if (!contract) {
        return respond({
          isSuccess: false,
          message: '계약서를 찾을 수 없습니다.',
        });
      }

      contract.summary = `${contract.summary} [수정요청: ${payload.reason}]`;
      contract.updatedAt = new Date().toISOString();

      return respond({
        isSuccess: true,
        data: payload.reason,
        message: '계약서 수정 요청이 전달되었습니다.',
      });
    },
  };
}
