// ===== 계약서 데이터 모델 =====

export interface ContractData {
  parties: {
    sellerName: string | null;
    buyerName: string | null;
  };
  item: {
    name: string;
    condition: string | null;
  };
  payment: {
    price: string;
    method: string;
  };
  delivery: {
    method: string | null;
    dateTime: string | null;
    location: string | null;
  };
  specialTerms?: string;
}

// ===== 생성/서명 관련 =====

export type EntityId = number | string;

export interface ContractCreateRequest {
  roomId?: string;
  sellerId: EntityId;
  buyerId: EntityId;
  deviceInfo?: string;
}

export interface ContractCreateResponse {
  isSuccess: boolean;
  data: ContractData | Record<string, unknown> | string;
  message?: string;
}

export type CreateContractRequest = ContractCreateRequest;
export type CreateContractResponse = ContractCreateResponse;

export interface ContractSignRequest {
  roomId: string;
  productId: EntityId;
  deviceInfo?: string;
}

export interface ContractSignResponse {
  isSuccess: boolean;
  data?: string | Record<string, unknown>;
  isBothSigned?: boolean;
  message?: string;
}

export type SignContractRequest = ContractSignRequest;
export type SignContractResponse = ContractSignResponse;

export interface ContractUploadPayload {
  pdf: File | Blob;
  sellerId?: EntityId;
  buyerId?: EntityId;
  roomId?: string;
}

export interface ContractUploadResponse {
  success: boolean;
  message: string;
  contractId: EntityId;
  filePath: string;
  sellerId?: EntityId;
  buyerId?: EntityId;
  roomId?: string;
  encryptedHash: string;
}

export interface ContractDeleteResponse {
  success: boolean;
  message: string;
  contractId: EntityId;
}

// ===== 상태/리스트 모델 =====

export enum ContractStatus {
  DRAFT = 'draft',
  SELLER_REVIEW = 'seller_review',
  BUYER_REVIEW = 'buyer_review',
  SIGNED = 'signed',
  VOID = 'void',
}

export interface ContractSummary {
  id: string | number;
  roomId?: string;
  sellerId: EntityId;
  sellerName?: string | null;
  buyerId: EntityId;
  buyerName?: string | null;
  productId?: EntityId;
  summary?: string;
  status: ContractStatus;
  updatedAt?: string;
}

export interface ContractListItem extends ContractSummary {}

export interface ContractListResponse {
  contracts: ContractListItem[];
  success: boolean;
  message?: string;
  count?: number;
}

export type ContractDraft = ContractSummary;

// ===== 부가 모델 =====

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
  userId: EntityId;
  ip?: string;
  ua?: string;
  at: string;
  linkHash?: string;
}

export interface ContractResponse {
  success: boolean;
  contract?: ContractSummary;
  message?: string;
}
