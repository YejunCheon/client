export interface User {
  /** Member identifier returned from the backend (numeric but stored as string for convenience) */
  id: string;
  /** Login identifier (a.k.a. username). Legacy alias `userId` is kept for backwards compatibility. */
  userId: string;
  name: string;
  ci?: string;
  signatureImage?: string | null;
  verified: boolean;
  role?: 'buyer' | 'seller';
}

export interface Member {
  memberId: number;
  /** Login identifier */
  id: string;
  name: string;
  ci: string;
  signatureImage?: string | null;
}

export interface RegisterRequest {
  /** Login identifier */
  id: string;
  password: string;
  token: string;
  signatureImage: File | Blob | string;
  /** Optional: retain name input when available for legacy flows */
  name?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  memberId?: number;
  id?: string;
  userId?: string;
  name?: string;
  ci?: string;
  signatureImage?: string;
}

export interface LoginRequest {
  /** Login identifier */
  id: string;
  password: string;
}

export type LoginResponse =
  | {
      success: true;
      message: string;
      memberId: number;
      id: string;
      userId: string;
      name?: string;
      token: string;
      signatureImage?: string | null;
      ci?: string;
    }
  | {
      success: false;
      message: string;
    };

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
  id?: string;
  userId?: string;
  name?: string;
  message?: string;
  memberId?: number;
  signatureImage?: string;
}
