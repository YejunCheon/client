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
        formData.append('name', payload.name);
        formData.append('residentNumber', payload.residentNumber);
        formData.append('phoneNumber', payload.phoneNumber);
        formData.append('signatureImage', signature);

        return client.postMultipart('/api/members/register', formData);
      }

      const data: RegisterRequest = {
        ...payload,
        signatureImage: signature,
      };

      return client.post('/api/members/register', data);
    },

    login(payload) {
      return client.post('/api/members/login', payload);
    },

    logout() {
      return client.post('/api/members/logout');
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
