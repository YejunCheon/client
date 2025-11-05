import type { CreateProductPayload } from '@/types/product';
import type { AuthHttpClient } from './http-client';
import { httpClient as defaultClient } from './http-client';
import type { ProductsApi } from './types';

function buildProductFormData(payload: CreateProductPayload): FormData {
  const formData = new FormData();
  formData.append('productName', payload.productName);
  formData.append('title', payload.title);
  formData.append('price', payload.price);
  formData.append('description', payload.description);

  if (payload.productImage instanceof File || payload.productImage instanceof Blob) {
    formData.append('productImage', payload.productImage);
  }

  return formData;
}

export function createProductsApi(client: AuthHttpClient = defaultClient): ProductsApi {
  return {
    async create(payload) {
      if (payload.productImage instanceof File || payload.productImage instanceof Blob) {
        return client.postMultipart('/api/products/create', buildProductFormData(payload));
      }

      return client.post('/api/products/create', payload);
    },

    remove(productId) {
      return client.delete(`/api/products/${productId}`);
    },

    get(productId) {
      return client.get(`/api/products/${productId}`);
    },

    list() {
      return client.get('/api/products/list');
    },

    listByMember(memberId) {
      return client.get(`/api/products/member/${memberId}`);
    },
  };
}

export const productsApi = createProductsApi();
