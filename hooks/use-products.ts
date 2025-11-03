import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductsByMember,
} from "@/lib/product-api";
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  MemberProductResponse,
  ProductListResponse,
  ProductResponse,
} from "@/types";

export const productKeys = {
  all: () => ["products"] as const,
  list: () => ["products", "list"] as const,
  detail: (productId: number | null) => ["products", "detail", productId] as const,
  member: (memberId: number | null) => ["products", "member", memberId] as const,
  memberRoot: () => ["products", "member"] as const,
} as const;

type ListQueryOptions<TData> = Omit<
  UseQueryOptions<ProductListResponse, Error, TData, ReturnType<typeof productKeys.list>>,
  "queryKey" | "queryFn"
>;

type DetailQueryOptions<TData> = Omit<
  UseQueryOptions<ProductResponse, Error, TData, ReturnType<typeof productKeys.detail>>,
  "queryKey" | "queryFn"
>;

type MemberQueryOptions<TData> = Omit<
  UseQueryOptions<MemberProductResponse, Error, TData, ReturnType<typeof productKeys.member>>,
  "queryKey" | "queryFn"
>;

type CreateMutationOptions = Omit<
  UseMutationOptions<CreateProductResponse, Error, CreateProductPayload>,
  "mutationFn"
>;

type DeleteMutationOptions = Omit<
  UseMutationOptions<DeleteProductResponse, Error, number>,
  "mutationFn"
>;

/**
 * 전체 상품 목록 조회 쿼리 훅
 */
export function useProductsList<TData = ProductListResponse>(
  options?: ListQueryOptions<TData>
): UseQueryResult<TData, Error> {
  return useQuery<ProductListResponse, Error, TData>({
    queryKey: productKeys.list(),
    queryFn: () => getProducts(),
    ...options,
  });
}

/**
 * 상품 단건 조회 쿼리 훅
 */
export function useProduct<TData = ProductResponse>(
  productId: number | null,
  options?: DetailQueryOptions<TData>
): UseQueryResult<TData, Error> {
  const { enabled = true, ...restOptions } = options ?? {};

  return useQuery<ProductResponse, Error, TData>({
    queryKey: productKeys.detail(productId),
    queryFn: () => {
      if (productId == null) {
        throw new Error("productId is required to fetch product detail");
      }
      return getProduct(productId);
    },
    enabled: productId != null && enabled,
    ...restOptions,
  });
}

/**
 * 특정 회원의 상품 목록 조회 쿼리 훅
 */
export function useMemberProducts<TData = MemberProductResponse>(
  memberId: number | null,
  options?: MemberQueryOptions<TData>
): UseQueryResult<TData, Error> {
  const { enabled = true, ...restOptions } = options ?? {};

  return useQuery<MemberProductResponse, Error, TData>({
    queryKey: productKeys.member(memberId),
    queryFn: () => {
      if (memberId == null) {
        throw new Error("memberId is required to fetch member products");
      }
      return getProductsByMember(memberId);
    },
    enabled: memberId != null && enabled,
    ...restOptions,
  });
}

/**
 * 상품 등록 뮤테이션 훅
 */
export function useCreateProductMutation(
  options?: CreateMutationOptions
): UseMutationResult<CreateProductResponse, Error, CreateProductPayload> {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<CreateProductResponse, Error, CreateProductPayload>({
    mutationFn: (payload) => createProduct(payload),
    onSuccess: (data, variables, context) => {
      // 목록 및 회원별 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
      queryClient.invalidateQueries({ queryKey: productKeys.memberRoot(), exact: false });
      onSuccess?.(data, variables, context);
    },
    ...restOptions,
  });
}

/**
 * 상품 삭제 뮤테이션 훅
 */
export function useDeleteProductMutation(
  options?: DeleteMutationOptions
): UseMutationResult<DeleteProductResponse, Error, number> {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<DeleteProductResponse, Error, number>({
    mutationFn: (productId) => deleteProduct(productId),
    onSuccess: (data, productId, context) => {
      // 상세/목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
      queryClient.invalidateQueries({ queryKey: productKeys.memberRoot(), exact: false });
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      onSuccess?.(data, productId, context);
    },
    ...restOptions,
  });
}
