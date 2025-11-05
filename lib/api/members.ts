import type { RegisterRequest } from '@/types/user';
import { httpClient as defaultClient } from './http-client';
import type { AuthHttpClient } from './http-client';
import type { MembersApi } from './types';

export function createMembersApi(client: AuthHttpClient = defaultClient): MembersApi {
  return {
    async register(payload) {
      const signature = payload.signatureImage;

      if (signature instanceof File || signature instanceof Blob) {
        const formData = new FormData();
        formData.append('userId', payload.userId);
        formData.append('password', payload.password);
        formData.append('name', payload.name);
        formData.append('token', payload.token);
        formData.append('signatureImage', signature);

        return client.postMultipart('/api/register', formData);
      }

      const data: RegisterRequest = {
        ...payload,
        signatureImage: signature,
      };

      return client.post('/api/register', data);
    },

    login(payload) {
      return client.post('/api/login', payload);
    },

    logout() {
      return client.post('/api/logout');
    },

    getProfile(memberId) {
      return client.get(`/api/members/${memberId}`);
    },

    getSignature(memberId) {
      return client.getBlob(`/api/members/signature/${memberId}`);
    },
  };
}

export const membersApi = createMembersApi();
