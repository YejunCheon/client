import {
  ContractCreateRequest,
  ContractCreateResponse,
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
  ContractSummaryRequest,
  ContractSummaryResponse,
  ContractReasonRequest,
  ContractReasonResponse,
} from '@/types/contract';
import type { AuthHttpClient } from './http-client';
import { httpClient as defaultClient } from './http-client';
import type { ContractsApi } from './types';

type RawContractListItem = Partial<ContractListItem> & {
  contractId?: EntityId;
  id?: EntityId;
  contractDataId?: EntityId;
  // API 응답에 sellerId/buyerId가 없을 수 있으므로 추가 필드 지원
  seller?: EntityId;
  buyer?: EntityId;
};

type RawContractListResponse =
  | RawContractListItem[]
  | {
      success?: boolean;
      contracts?: RawContractListItem[];
      message?: string;
      count?: number;
    };

function toNumericId(value: string | number | undefined): string | number | undefined {
  if (value == null) {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

function stringifyContract(
  contract: ContractSignRequest['contract'] | ContractEditRequest['contract']
): string | undefined {
  if (contract == null) {
    return undefined;
  }
  if (typeof contract === 'string') {
    return contract;
  }
  try {
    return JSON.stringify(contract);
  } catch {
    return undefined;
  }
}

function buildCreatePayload(payload: ContractCreateRequest) {
  return {
    ...payload,
    sellerId: toNumericId(payload.sellerId),
    buyerId: toNumericId(payload.buyerId),
  };
}

function buildSignPayload(payload: ContractSignRequest) {
  return {
    ...payload,
    productId: toNumericId(payload.productId),
    contract: stringifyContract(payload.contract),
  };
}

function buildSearchLikePayload(
  payload: ContractSearchRequest | ContractRejectRequest | ContractSendRequest | ContractSummaryRequest | ContractReasonRequest
) {
  return {
    roomId: payload.roomId,
    sellerId: toNumericId(payload.sellerId),
    buyerId: toNumericId(payload.buyerId),
    deviceInfo: payload.deviceInfo,
  };
}

function buildEditPayload(payload: ContractEditRequest) {
  return {
    ...payload,
    contract: stringifyContract(payload.contract),
  };
}

function normalizeStatus(status: unknown): ContractStatus {
  if (!status) {
    return ContractStatus.PENDING_BOTH;
  }

  const raw = String(status).trim().toUpperCase();
  const normalized = raw.replace(/[\s-]/g, '_');

  switch (normalized) {
    case 'PENDING_BOTH':
    case 'DRAFT':
      return ContractStatus.PENDING_BOTH;
    case 'PENDING_SELLER':
    case 'SELLER_REVIEW':
    case 'SELLERREVIEW':
      return ContractStatus.PENDING_SELLER;
    case 'PENDING_BUYER':
    case 'BUYER_REVIEW':
    case 'BUYERREVIEW':
      return ContractStatus.PENDING_BUYER;
    case 'COMPLETED':
    case 'SIGNED':
    case 'COMPLETE':
      return ContractStatus.COMPLETED;
    default:
      return ContractStatus.PENDING_BOTH;
  }
}

function normalizeContractListItem(item: RawContractListItem): ContractListItem {
  // contractDataId가 있으면 그것을 id로 사용
  const resolvedId = item.contractId ?? item.contractDataId ?? item.id ?? '';

  // 다양한 필드명 시도 (하위 호환성)
  const sellerId = item.sellerId 
    ?? item.seller
    ?? '';
  const buyerId = item.buyerId 
    ?? item.buyer
    ?? '';

  const normalized: ContractListItem = {
    id: resolvedId,
    contractId: resolvedId,
    roomId: item.roomId ?? (item as { room?: string }).room,
    sellerId,
    sellerName: item.sellerName,
    buyerId,
    buyerName: item.buyerName,
    productId: item.productId,
    summary: item.summary,
    status: normalizeStatus(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  // 디버깅: sellerId/buyerId가 없으면 경고
  if (!sellerId && !buyerId) {
    console.warn('[normalizeContractListItem] Missing sellerId and buyerId:', {
      rawItem: item,
      normalized,
      contractDataId: item.contractDataId,
      suggestion: 'API response may need additional fields or contract detail lookup via roomId or contractDataId',
    });
  }

  return normalized;
}

function normalizeContractListResponse(raw: RawContractListResponse): ContractListResponse {
  if (Array.isArray(raw)) {
    const contracts = raw.map(normalizeContractListItem);
    return {
      success: true,
      contracts,
      count: contracts.length,
    };
  }

  const contracts = Array.isArray(raw?.contracts)
    ? raw.contracts.map(normalizeContractListItem)
    : [];

  return {
    success: raw?.success ?? true,
    message: raw?.message,
    contracts,
    count: raw?.count ?? contracts.length,
  };
}

function buildHeaders(deviceInfo?: string) {
  return deviceInfo
    ? {
        headers: {
          'User-Agent': deviceInfo,
        },
      }
    : undefined;
}

function buildContractUploadFormData(payload: ContractUploadPayload): FormData {
  const formData = new FormData();
  formData.append('pdf', payload.pdf);

  if (payload.sellerId != null) {
    formData.append('sellerId', String(payload.sellerId));
  }

  if (payload.buyerId != null) {
    formData.append('buyerId', String(payload.buyerId));
  }

  if (payload.roomId) {
    formData.append('roomId', payload.roomId);
  }

  return formData;
}

// 서버 응답의 success를 isSuccess로 정규화
function normalizeCreateResponse(
  raw: ContractCreateResponse & { success?: boolean }
): ContractCreateResponse {
  console.log('[contractsApi.create] Raw response:', JSON.stringify(raw, null, 2));
  
  const normalized: ContractCreateResponse = {
    isSuccess: raw.isSuccess ?? raw.success ?? false,
    contractResponseDto: raw.contractResponseDto,
    data: raw.data,
  };

  console.log('[contractsApi.create] Normalized response:', JSON.stringify(normalized, null, 2));
  
  return normalized;
}

function normalizeSummaryResponse(
  raw: ContractSummaryResponse & { success?: boolean; summary?: string | { final_summary: string } }
): ContractSummaryResponse {
  console.log('[contractsApi.getSummary] Raw response:', JSON.stringify(raw, null, 2));
  
  // summary가 문자열인 경우 (하위 호환성) 또는 객체인 경우 처리
  let normalizedSummary: { final_summary: string };
  if (typeof raw.summary === 'string') {
    normalizedSummary = { final_summary: raw.summary };
  } else if (raw.summary?.final_summary) {
    normalizedSummary = raw.summary;
  } else {
    normalizedSummary = { final_summary: '' };
  }
  
  const normalized: ContractSummaryResponse = {
    isSuccess: raw.isSuccess ?? raw.success ?? false,
    summary: normalizedSummary,
    data: raw.data,
  };

  console.log('[contractsApi.getSummary] Normalized response:', JSON.stringify(normalized, null, 2));
  
  return normalized;
}

export function createContractsApi(
  client: AuthHttpClient = defaultClient
): ContractsApi {
  return {
    async list(params) {
      const response = await client.get<RawContractListResponse>(
        '/api/contracts/contractLists',
        params?.roomId ? { params: { roomId: params.roomId } } : undefined
      );
      return normalizeContractListResponse(response);
    },

    async create(payload) {
      const rawResponse = await client.post<
        ContractCreateResponse & { success?: boolean }
      >('/api/contracts/create', buildCreatePayload(payload));
      return normalizeCreateResponse(rawResponse);
    },

    sign(payload) {
      return client.post<ContractSignResponse>(
        '/api/contracts/sign',
        buildSignPayload(payload)
      );
    },

    search(payload) {
      return client.post<ContractSearchResponse>(
        '/api/contracts/search',
        buildSearchLikePayload(payload)
      );
    },

    reject(payload) {
      return client.post<ContractSendResponse>(
        '/api/contracts/reject',
        buildSearchLikePayload(payload)
      );
    },

    edit(payload) {
      return client.post<ContractSearchResponse>(
        '/api/contracts/edit',
        buildEditPayload(payload)
      );
    },

    send(payload) {
      return client.post<ContractSendResponse>(
        '/api/contracts/send',
        buildSearchLikePayload(payload)
      );
    },

    detail(params) {
      const headerConfig = buildHeaders(params.deviceInfo);
      const queryConfig = {
        params: { roomId: params.roomId },
        ...(headerConfig ?? {}),
      };

      if (params.responseType === 'json') {
        return client.get<Exclude<ContractDetailResponse, Blob>>(
          '/api/contracts/detail',
          queryConfig
        );
      }

      return client.getBlob(
        '/api/contracts/detail',
        queryConfig
      );
    },

    upload(payload) {
      return client.postMultipart<ContractUploadResponse>(
        '/api/contracts/upload',
        buildContractUploadFormData(payload)
      );
    },

    delete(contractId) {
      return client.delete<ContractDeleteResponse>(
        `/api/contracts/${contractId}`
      );
    },

    // Seller separated flow
    async getSummary(payload) {
      const rawResponse = await client.post<
        ContractSummaryResponse & { success?: boolean }
      >('/api/contracts/summary', buildSearchLikePayload(payload));
      return normalizeSummaryResponse(rawResponse);
    },

    getReason(payload) {
      return client.post<ContractReasonResponse>(
        '/api/contracts/reason',
        buildSearchLikePayload(payload)
      );
    },

    // Buyer signing flow
    buyerDetail(payload) {
      return client.post<BuyerContractDetailResponse>(
        '/api/contracts/buyer/detail',
        payload,
        buildHeaders(payload.deviceInfo)
      );
    },

    buyerAccept(payload) {
      return client.post<BuyerContractAcceptResponse>(
        '/api/contracts/buyer/accept',
        payload,
        buildHeaders(payload.deviceInfo)
      );
    },

    buyerReject(payload) {
      return client.post<BuyerContractRejectResponse>(
        '/api/contracts/buyer/reject',
        payload,
        buildHeaders(payload.deviceInfo)
      );
    },
  };
}

export const contractsApi = createContractsApi();
