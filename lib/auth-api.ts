import { apiClient } from './api-client';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  GetMemberResponse,
  LogoutResponse,
} from '@/types/user';

/**
 * 회원 관련 REST API 호출 함수
 */

// 회원가입
export async function register(
  request: RegisterRequest
): Promise<RegisterResponse> {
  // signatureImage가 File이면 FormData로 전송, string이면 JSON으로 전송
  if (request.signatureImage instanceof File) {
    const formData = new FormData();
    formData.append('username', request.username);
    formData.append('password', request.password);
    formData.append('name', request.name);
    formData.append('signatureImage', request.signatureImage);

    return apiClient.postMultipart<RegisterResponse>(
      '/api/members/register',
      formData
    );
  } else {
    return apiClient.post<RegisterResponse>('/api/members/register', {
      username: request.username,
      password: request.password,
      name: request.name,
      signatureImage: request.signatureImage,
    });
  }
}

// 로그인
export async function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/api/members/login', request);
}

// 유저 정보 조회
export async function getMember(memberId: number): Promise<GetMemberResponse> {
  return apiClient.get<GetMemberResponse>(`/api/members/${memberId}`);
}

// 로그아웃
export async function logout(): Promise<LogoutResponse> {
  return apiClient.post<LogoutResponse>('/api/members/logout');
}

// 서명 이미지 조회 (이미지 파일 반환)
export async function getSignatureImage(memberId: number): Promise<Blob> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/members/signature/${memberId}`,
    {
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch signature image');
  }
  
  return response.blob();
}

