import type { RegisterRequest } from '@/types/user';
import { httpClient as defaultClient } from './http-client';
import type { AuthHttpClient } from './http-client';
import type { MembersApi } from './types';

function createRegisterJsonPayload(payload: RegisterRequest) {
  const data: Record<string, unknown> = {
    id: payload.id,
    password: payload.password,
    token: payload.token,
    signatureImage: payload.signatureImage,
  };

  if (payload.name) {
    data.name = payload.name;
  }

  return data;
}

export function createMembersApi(client: AuthHttpClient = defaultClient): MembersApi {
  return {
    async register(payload) {
      const signature = payload.signatureImage;

      if (signature instanceof File || signature instanceof Blob) {
        const formData = new FormData();
        formData.append('id', payload.id);
        formData.append('password', payload.password);
        formData.append('token', payload.token);
        formData.append('signatureImage', signature);

        if (payload.name) {
          formData.append('name', payload.name);
        }

        return client.postMultipart('/api/members/register', formData);
      }

      const data = createRegisterJsonPayload({
        ...payload,
        signatureImage: signature,
      });

      return client.post('/api/members/register', data);
    },

    login(payload) {
      return client.post('/api/members/login', {
        id: payload.id,
        password: payload.password,
      });
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
