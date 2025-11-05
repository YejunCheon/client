export interface Product {
  id: number;
  productName: string;
  title: string;
  description: string;
  price: string;
  productImage: string;
  memberId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  productName: string;
  price: string;
  description: string;
  productImage: File | Blob | string;
  title: string;
}

export interface CreateProductResponse {
  success: boolean;
  message: string;
  productName: string;
  productId: number;
  productImage: string;
  title: string;
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
  products: Product[];
}

export interface MemberProductResponse {
  success: boolean;
  count: number;
  products: Product[];
}
