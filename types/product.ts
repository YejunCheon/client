export interface Product {
  id: string;
  productName: string;
  title?: string;
  price: number;
  description: string;
  productImage: string;
  memberId: string;
}

export interface ProductListResponse {
  product: Product[];
  success: boolean;
  count?: number;
}

export interface ProductResponse {
  product: Product;
  success: boolean;
}

export interface CreateProductResponse {
  productImage: string;
  productId: string;
  success: boolean;
  message: string;
  productName: string;
}

