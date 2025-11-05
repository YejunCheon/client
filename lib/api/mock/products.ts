import { mockProducts } from '@/mocks/data/products';
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  MemberProductResponse,
  Product,
  ProductListResponse,
  ProductResponse,
} from '@/types/product';
import type { ProductsApi } from '../types';
import { generateId, respond } from './utils';

function cloneProduct(product: Product): Product {
  return { ...product };
}

function resolveImagePath(image: CreateProductPayload['productImage']): string {
  if (typeof image === 'string') {
    return image;
  }

  if (image instanceof File || image instanceof Blob) {
    return `/uploads/products/${generateId('product')}.png`;
  }

  return '/assets/mock_product_img.png';
}

export function createMockProductsApi(): ProductsApi {
  return {
    async create(payload: CreateProductPayload): Promise<CreateProductResponse> {
      const nextId =
        mockProducts.reduce((max, product) => Math.max(max, product.id), 0) + 1;

      const ownerId =
        (payload as Partial<{ memberId: number }>).memberId ?? 101;

      const newProduct: Product = {
        id: nextId,
        productName: payload.productName,
        title: payload.title,
        description: payload.description,
        price: payload.price,
        productImage: resolveImagePath(payload.productImage),
        memberId: ownerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProducts.push(newProduct);

      return respond({
        success: true,
        message: '상품이 등록되었습니다.',
        productName: newProduct.productName,
        productId: newProduct.id,
        productImage: newProduct.productImage,
        title: newProduct.title,
      });
    },

    async remove(productId: number): Promise<DeleteProductResponse> {
      const index = mockProducts.findIndex((product) => product.id === productId);

      if (index === -1) {
        return respond({
          success: false,
          message: '상품을 찾을 수 없습니다.',
        });
      }

      mockProducts.splice(index, 1);

      return respond({
        success: true,
        message: '상품이 삭제되었습니다.',
      });
    },

    async get(productId: number): Promise<ProductResponse> {
      const product = mockProducts.find((item) => item.id === productId);

      if (!product) {
        return respond({
          success: false,
          product: {
            id: productId,
            productName: '',
            title: '',
            description: '',
            price: '',
            productImage: '',
            memberId: 0,
          },
        });
      }

      return respond({
        success: true,
        product: cloneProduct(product),
      });
    },

    async list(): Promise<ProductListResponse> {
      return respond({
        success: true,
        count: mockProducts.length,
        products: mockProducts.map(cloneProduct),
      });
    },

    async listByMember(memberId: number): Promise<MemberProductResponse> {
      const products = mockProducts.filter((product) => product.memberId === memberId);
      return respond({
        success: true,
        count: products.length,
        products: products.map(cloneProduct),
      });
    },
  };
}
