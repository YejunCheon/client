import { mockMembers, type MockMemberRecord } from '@/mocks/data/members';
import type {
  GetMemberResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/user';
import type { MembersApi } from '../types';
import { generateId, respond } from './utils';

const signatureMap = new Map<number, Blob>();

function toMemberResponse(member: MockMemberRecord): GetMemberResponse {
  return {
    success: true,
    member: {
      id: member.id,
      name: member.name,
      residentNumber: member.residentNumber,
      phoneNumber: member.phoneNumber,
      signatureImage: member.signatureImage ?? null,
    },
  };
}

function ensureSignatureBlob(memberId: number, signature?: string | null): Blob {
  if (signatureMap.has(memberId)) {
    return signatureMap.get(memberId)!;
  }

  const blob = new Blob(
    [
      JSON.stringify({
        memberId,
        signature: signature ?? `mock-signature-${memberId}`,
      }),
    ],
    { type: 'application/json' }
  );

  signatureMap.set(memberId, blob);
  return blob;
}

export function createMockMembersApi(): MembersApi {
  return {
    async register(payload: RegisterRequest): Promise<RegisterResponse> {
      const nextId =
        mockMembers.reduce((max, member) => Math.max(max, member.id), 0) + 1;

      let signatureImagePath: string;

      if (typeof payload.signatureImage === 'string') {
        signatureImagePath = payload.signatureImage;
      } else {
        signatureImagePath = `/uploads/signature/mock-${generateId(
          String(nextId)
        )}.png`;
        ensureSignatureBlob(nextId, signatureImagePath);
      }

      const newMember: MockMemberRecord = {
        id: nextId,
        name: payload.name,
        residentNumber: payload.residentNumber,
        phoneNumber: payload.phoneNumber,
        signatureImage: signatureImagePath,
      };

      mockMembers.push(newMember);

      const response: RegisterResponse = {
        success: true,
        message: '회원가입이 완료되었습니다.',
        memberId: newMember.id,
        name: newMember.name,
        signatureImage: signatureImagePath,
      };

      return respond(response);
    },

    async login(payload: LoginRequest): Promise<LoginResponse> {
      const member = mockMembers.find(
        (m) =>
          m.name === payload.name &&
          m.residentNumber === payload.residentNumber &&
          m.phoneNumber === payload.phoneNumber
      );

      if (!member) {
        return respond({
          success: false,
          message: '일치하는 회원 정보가 없습니다.',
          memberId: 0,
          name: payload.name,
        });
      }

      return respond({
        success: true,
        message: '로그인 성공',
        memberId: member.id,
        name: member.name,
        token: `mock-token-${member.id}`,
      });
    },

    async logout(): Promise<LogoutResponse> {
      return respond({
        success: true,
        message: '로그아웃 되었습니다.',
      });
    },

    async getProfile(memberId: number): Promise<GetMemberResponse> {
      const member = mockMembers.find((m) => m.id === memberId);

      if (!member) {
        return respond({
          success: false,
          member: {
            id: memberId,
            name: '',
            residentNumber: '',
            phoneNumber: '',
            signatureImage: null,
          },
        });
      }

      return respond(toMemberResponse(member));
    },

    async getSignature(memberId: number): Promise<Blob> {
      const member = mockMembers.find((m) => m.id === memberId);
      return respond(
        ensureSignatureBlob(memberId, member?.signatureImage ?? null)
      );
    },
  };
}
