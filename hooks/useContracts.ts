import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ContractListItem, ContractListResponse } from '@/types/contract';

async function fetchContracts(): Promise<ContractListResponse> {
  const response = await apiClient.get<ContractListResponse>('/contracts');
  return response;
}

export function useContracts() {
  return useQuery<ContractListResponse, Error>({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
  });
}
