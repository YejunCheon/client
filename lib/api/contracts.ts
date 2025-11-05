import type {
  ContractCreateRequest,
  ContractSignRequest,
  ContractUploadPayload,
  ContractUploadResponse,
} from '@/types/contract';
import type { AuthHttpClient } from './http-client';
import { httpClient as defaultClient } from './http-client';
import type { ContractsApi } from './types';

function buildContractUploadFormData(
  payload: ContractUploadPayload
): FormData {
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

function toNumericId(value: string | number | undefined) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
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
  };
}

export function createContractsApi(
  client: AuthHttpClient = defaultClient
): ContractsApi {
  return {
    list() {
      return client.get('/api/contracts');
    },

    create(payload) {
      return client.post('/api/contracts/create', buildCreatePayload(payload));
    },

    sign(payload) {
      return client.post('/api/contracts/sign', buildSignPayload(payload));
    },

    upload(payload) {
      return client.postMultipart<ContractUploadResponse>(
        '/api/contracts/upload',
        buildContractUploadFormData(payload)
      );
    },

    download(contractId) {
      return client.getBlob(`/api/contracts/${contractId}`);
    },

    delete(contractId) {
      return client.delete(`/api/contracts/${contractId}`);
    },
  };
}

export const contractsApi = createContractsApi();
