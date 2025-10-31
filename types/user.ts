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
  id: string;
  name: string;
  residentNumber: string;
  phoneNumber: string;
  signatureImage?: string;
}

export interface AuthResponse {
  success: boolean;
  name?: string;
  message?: string;
  memberId?: string;
  signatureImage?: string;
}

