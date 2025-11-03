export interface Product {
  id: number;
  productName: string;
  title: string;
  description: string;
  price: string;
  productImage: string;
  memberId: number;
}

export interface CreateProductPayload {
  productName: string;
  price: string;
  description: string;
  productImage: File | string;
  title: string;
}

export interface CreateProductResponse {
  success: boolean;
  message: string;
  productName: string;
  productId: number;
  productImage: string;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

export interface ProductListResponse {
  success: boolean;
  count: number;
  product: Product[];
}

export interface MemberProductResponse {
  success: boolean;
  product: Product[];
}
