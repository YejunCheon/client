import { createChatApi } from './chat';
import { createContractsApi } from './contracts';
import { httpClient } from './http-client';
import { createMembersApi } from './members';
import { createProductsApi } from './products';
import type { ApiMode, ApiRegistry } from './types';
import { createMockApi, mockApi as defaultMockApi } from './mock';

const httpApi: ApiRegistry = {
  members: createMembersApi(httpClient),
  products: createProductsApi(httpClient),
  contracts: createContractsApi(httpClient),
  chat: createChatApi(httpClient),
};

const defaultMode: ApiMode = 'http';

const resolvedMode =
  (process.env.NEXT_PUBLIC_API_MODE as ApiMode | undefined) ?? defaultMode;

export const apiMode: ApiMode = resolvedMode;
export const realApi = httpApi;
export const mockApi = defaultMockApi;

export const api: ApiRegistry =
  resolvedMode === 'mock' ? mockApi : realApi;

export function getApi(mode?: ApiMode): ApiRegistry {
  switch (mode ?? apiMode) {
    case 'mock':
      return mockApi;
    case 'http':
    default:
      return realApi;
  }
}

export function useMockApi(): boolean {
  return apiMode === 'mock';
}

export function setApiMode(mode: ApiMode): ApiRegistry {
  return getApi(mode);
}
