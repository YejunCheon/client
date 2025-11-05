import type { ApiRegistry } from '../types';
import { createMockMembersApi } from './members';
import { createMockProductsApi } from './products';
import { createMockContractsApi } from './contracts';
import { createMockChatApi } from './chat';

let cachedMockApi: ApiRegistry | null = null;

export function createMockApi(): ApiRegistry {
  if (cachedMockApi) {
    return cachedMockApi;
  }

  cachedMockApi = {
    members: createMockMembersApi(),
    products: createMockProductsApi(),
    contracts: createMockContractsApi(),
    chat: createMockChatApi(),
  };

  return cachedMockApi;
}

export const mockApi = createMockApi();
