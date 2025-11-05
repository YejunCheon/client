import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContractListResponse } from '@/types/contract';

async function fetchContracts(): Promise<ContractListResponse> {
  return api.contracts.list();
}

type UseContractsOptions = Omit<
  UseQueryOptions<ContractListResponse, Error, ContractListResponse, ['contracts']>,
  'queryKey' | 'queryFn'
>;

export function useContracts(options?: UseContractsOptions) {
  return useQuery<ContractListResponse, Error>({
    queryKey: ['contracts'],
    queryFn: fetchContracts,
    ...options,
  });
}
