import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { api } from '@/lib/api';
import type { ContractListResponse } from '@/types/contract';

interface FetchContractsParams {
  roomId?: string;
}

async function fetchContracts(
  params?: FetchContractsParams
): Promise<ContractListResponse> {
  try {
    return await api.contracts.list(params);
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        const responseMessage =
          typeof error.response?.data === 'object' && error.response?.data !== null
            ? (error.response?.data as { message?: string }).message
            : undefined;

        return {
          success: false,
          message: responseMessage ?? '계약서를 조회할 권한이 없습니다.',
          contracts: [],
          count: 0,
        };
      }
    }

    throw error;
  }
}

type UseContractsOptions = Omit<
  UseQueryOptions<
    ContractListResponse,
    Error,
    ContractListResponse,
    ['contracts', FetchContractsParams | undefined, string | number | null]
  >,
  'queryKey' | 'queryFn'
> & {
  params?: FetchContractsParams;
  viewerKey?: string | number | null;
};

export function useContracts(options?: UseContractsOptions) {
  const { params, viewerKey, ...queryOptions } = options ?? {};

  return useQuery<ContractListResponse, Error>({
    queryKey: ['contracts', params, viewerKey ?? null],
    queryFn: () => fetchContracts(params),
    retry: false,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}
