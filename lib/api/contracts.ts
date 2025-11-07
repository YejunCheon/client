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
} from '@/types/contract';
import type { AuthHttpClient } from './http-client';
import { httpClient as defaultClient } from './http-client';
import type { ContractsApi } from './types';

type RawContractListItem = Partial<ContractListItem> & {
  contractId?: EntityId;
  id?: EntityId;
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
  payload: ContractSearchRequest | ContractRejectRequest | ContractSendRequest
) {
  return {
    ...payload,
    sellerId: toNumericId(payload.sellerId),
    buyerId: toNumericId(payload.buyerId),
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
    return ContractStatus.DRAFT;
  }

  const value = String(status).toLowerCase();

  switch (value) {
    case 'seller_review':
    case 'seller-review':
    case 'sellerreview':
      return ContractStatus.SELLER_REVIEW;
    case 'buyer_review':
    case 'buyer-review':
    case 'buyerreview':
      return ContractStatus.BUYER_REVIEW;
    case 'signed':
    case 'completed':
    case 'complete':
      return ContractStatus.SIGNED;
    case 'void':
    case 'cancelled':
    case 'canceled':
      return ContractStatus.VOID;
    case 'draft':
    default:
      return ContractStatus.DRAFT;
  }
}

function normalizeContractListItem(item: RawContractListItem): ContractListItem {
  const resolvedId = item.contractId ?? item.id ?? '';

  const sellerId = item.sellerId ?? (item as { seller?: EntityId }).seller ?? '';
  const buyerId = item.buyerId ?? (item as { buyer?: EntityId }).buyer ?? '';

  return {
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

    create(payload) {
      return client.post<ContractCreateResponse>(
        '/api/contracts/create',
        buildCreatePayload(payload)
      );
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
