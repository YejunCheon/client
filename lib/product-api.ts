import { apiClient } from "./api-client";
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  MemberProductResponse,
  ProductListResponse,
  ProductResponse,
} from "@/types";

/**
 * 상품 관련 REST API 래퍼
 */

// 상품 등록
export async function createProduct(
  payload: CreateProductPayload
): Promise<CreateProductResponse> {
  if (payload.productImage instanceof File) {
    const formData = new FormData();
    formData.append("productName", payload.productName);
    formData.append("price", payload.price);
    formData.append("description", payload.description);
    formData.append("title", payload.title);
    formData.append("productImage", payload.productImage);

    return apiClient.postMultipart<CreateProductResponse>("/api/product/create", formData);
  }

  return apiClient.post<CreateProductResponse>("/api/product/create", payload);
}

// 상품 삭제
export async function deleteProduct(productId: number): Promise<DeleteProductResponse> {
  return apiClient.delete<DeleteProductResponse>(`/api/product/${productId}`);
}

// 상품 단건 조회
export async function getProduct(productId: number): Promise<ProductResponse> {
  return apiClient.get<ProductResponse>(`/api/product/${productId}`);
}

// 전체 상품 목록 조회
export async function getProducts(): Promise<ProductListResponse> {
  return apiClient.get<ProductListResponse>("/api/product/list");
}

// 특정 회원 상품 목록 조회
export async function getProductsByMember(
  memberId: number
): Promise<MemberProductResponse> {
  return apiClient.get<MemberProductResponse>(`/api/product/member/${memberId}`);
}
