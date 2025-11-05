export interface User {
  id: string;
  userId: string;
  name: string;
  ci?: string;
  signatureImage?: string | null;
  verified: boolean;
  role?: 'buyer' | 'seller';
}

export interface Member {
  id: number;
  userId: string;
  name: string;
  ci: string;
  signatureImage?: string | null;
}

export interface RegisterRequest {
  userId: string;
  password: string;
  name: string;
  signatureImage: File | Blob | string;
  token: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  memberId?: number;
  userId?: string;
  name?: string;
  ci?: string;
  signatureImage?: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  memberId?: number;
  userId?: string;
  name?: string;
  token?: string;
  signatureImage?: string | null;
  ci?: string;
}

export interface GetMemberResponse {
  success: boolean;
  member: Member;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  userId?: string;
  name?: string;
  message?: string;
  memberId?: number;
  signatureImage?: string;
}
