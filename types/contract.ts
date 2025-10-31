export interface ContractDraft {
  id: string;
  roomId?: string;
  sellerId: string;
  buyerId: string;
  productId?: string;
  terms: Record<string, string | number | boolean>;
  summary?: string;
  status: ContractStatus;
}

export enum ContractStatus {
  DRAFT = 'draft',
  SELLER_REVIEW = 'seller_review',
  BUYER_REVIEW = 'buyer_review',
  SIGNED = 'signed',
  VOID = 'void',
}

export interface ContractFile {
  id: string;
  url: string;
  hash: string;
  kmsKeyRef?: string;
  encrypted: boolean;
}

export interface AuditEvent {
  id: string;
  action: string;
  userId: string;
  ip?: string;
  ua?: string;
  at: string;
  linkHash?: string;
}

export interface ContractResponse {
  success: boolean;
  contract?: ContractDraft;
  message?: string;
}

