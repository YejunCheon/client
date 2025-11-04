export interface User {
  id: string;
  name: string;
  residentNumber?: string;
  phoneNumber?: string;
  signatureImage?: string;
  verified: boolean;
  role?: 'buyer' | 'seller';
}

export interface Member {
  id: number;
  name: string;
  residentNumber: string;
  phoneNumber: string;
  signatureImage?: string;
}

// 회원가입 요청
export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
  signatureImage: File | string; // File은 FormData로 전송, string은 이미 업로드된 경로
}

// 회원가입 응답
export interface RegisterResponse {
  success: boolean;
  name: string;
  signatureImage: string;
  message: string;
  memberId: number;
}

// 로그인 요청
export interface LoginRequest {
  username: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  success: boolean;
  name: string;
  message: string;
  memberId: number;
}

// 유저 정보 조회 응답
export interface GetMemberResponse {
  success: boolean;
  member: Member;
}

// 로그아웃 응답
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// 기존 AuthResponse는 하위 호환성을 위해 유지
export interface AuthResponse {
  success: boolean;
  name?: string;
  message?: string;
  memberId?: number;
  signatureImage?: string;
}

