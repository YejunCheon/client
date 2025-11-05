import { mockMembers, type MockMemberRecord } from '@/mocks/data/members';
import {
  consumeMockVerifyToken,
  getMockVerifyToken,
} from '@/mocks/verify-tokens';
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
      memberId: member.memberId,
      id: member.id,
      name: member.name,
      ci: member.ci,
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
      if (!payload.id || !payload.password || !payload.token) {
        return respond({
          success: false,
          message: '필수 값이 누락되었습니다.',
        });
      }

      const normalizedUserId = payload.id.trim();

      if (!normalizedUserId) {
        return respond({
          success: false,
          message: '아이디를 입력해주세요.',
        });
      }

      const existingUserId = mockMembers.some(
        (member) => member.id.toLowerCase() === normalizedUserId.toLowerCase()
      );

      if (existingUserId) {
        return respond({
          success: false,
          message: '이미 사용 중인 아이디입니다.',
        });
      }

      const verifyPayload = getMockVerifyToken(payload.token);
      if (!verifyPayload) {
        return respond({
          success: false,
          message: '본인인증 토큰이 유효하지 않습니다.',
        });
      }

      let ci: string;
      let verifiedName: string;

      try {
        const resolved = consumeMockVerifyToken(payload.token);
        ci = resolved.ci;
        verifiedName = resolved.name;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '본인인증 토큰을 확인할 수 없습니다.';
        return respond({
          success: false,
          message,
        });
      }

      const requestedName = payload.name?.trim();

      if (requestedName && requestedName !== verifiedName) {
        return respond({
          success: false,
          message: '본인인증 결과와 입력하신 이름이 일치하지 않습니다.',
        });
      }

      const existingCi = mockMembers.some((member) => member.ci === ci);

      if (existingCi) {
        return respond({
          success: false,
          message: '이미 가입된 사용자입니다.',
        });
      }

      const nextId =
        mockMembers.reduce((max, member) => Math.max(max, member.memberId), 0) + 1;

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
        memberId: nextId,
        id: normalizedUserId,
        name: verifiedName,
        ci,
        signatureImage: signatureImagePath,
        password: payload.password,
      };

      mockMembers.push(newMember);

      const response: RegisterResponse = {
        success: true,
        message: '회원가입이 완료되었습니다.',
        memberId: newMember.memberId,
        id: newMember.id,
        userId: newMember.id,
        name: newMember.name,
        ci: newMember.ci,
        signatureImage: signatureImagePath,
      };

      return respond(response);
    },

    async login(payload: LoginRequest): Promise<LoginResponse> {
      if (!payload.id || !payload.password) {
        return respond({
          success: false,
          message: '아이디와 비밀번호를 입력해주세요.',
        });
      }

      const member = mockMembers.find((m) => m.id === payload.id);

      if (!member) {
        return respond({
          success: false,
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        });
      }

      if (member.password !== payload.password) {
        return respond({
          success: false,
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        });
      }

      return respond({
        success: true,
        message: '로그인 성공',
        memberId: member.memberId,
        id: member.id,
        userId: member.id,
        name: member.name,
        ci: member.ci,
        token: `mock-token-${member.memberId}`,
        signatureImage: member.signatureImage ?? null,
      });
    },

    async logout(): Promise<LogoutResponse> {
      return respond({
        success: true,
        message: '로그아웃 되었습니다.',
      });
    },

    async getProfile(memberId: number): Promise<GetMemberResponse> {
      const member = mockMembers.find((m) => m.memberId === memberId);

      if (!member) {
        return respond({
          success: false,
          member: {
            memberId,
            id: '',
            name: '',
            ci: '',
            signatureImage: null,
          },
        });
      }

      return respond(toMemberResponse(member));
    },

    async getSignature(memberId: number): Promise<Blob> {
      const member = mockMembers.find((m) => m.memberId === memberId);
      return respond(
        ensureSignatureBlob(memberId, member?.signatureImage ?? null)
      );
    },
  };
}
