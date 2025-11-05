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
  summary?: string;
  message?: string;
}

export type CreateContractRequest = ContractCreateRequest;
export type CreateContractResponse = ContractCreateResponse;

export interface ContractSignRequest {
  roomId: string;
  productId: EntityId;
  deviceInfo?: string;
  contract?: string | Record<string, unknown>;
}

export interface ContractSignResponse {
  isSuccess: boolean;
  data?: string | Record<string, unknown>;
  bothSign?: boolean;
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

export interface ContractSearchRequest {
  roomId: string;
  sellerId: EntityId;
  buyerId: EntityId;
  deviceInfo?: string;
}

export interface ContractSearchResponse {
  isSuccess: boolean;
  data?: ContractData | Record<string, unknown> | string;
  summary?: string;
  message?: string;
}

export interface ContractRejectRequest {
  roomId: string;
  sellerId: EntityId;
  buyerId: EntityId;
  deviceInfo?: string;
}

export interface ContractEditRequest {
  roomId: string;
  contract: string | Record<string, unknown>;
  deviceInfo?: string;
}

export interface ContractSendRequest {
  roomId: string;
  sellerId: EntityId;
  buyerId: EntityId;
  deviceInfo?: string;
}

export interface ContractSendResponse {
  isSuccess: boolean;
  data?: string | Record<string, unknown>;
  summary?: string;
  message?: string;
  bothSign?: boolean;
}

export interface ContractDetailParams {
  roomId: string;
  deviceInfo?: string;
  /** Desired response format. Defaults to binary(PDF). */
  responseType?: 'json' | 'pdf';
}

export type ContractDetailResponse =
  | Blob
  | ContractData
  | Record<string, unknown>
  | string;

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
  contractId?: EntityId;
  roomId?: string;
  sellerId: EntityId;
  sellerName?: string | null;
  buyerId: EntityId;
  buyerName?: string | null;
  productId?: EntityId;
  summary?: string;
  status: ContractStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContractListItem extends ContractSummary {}

export interface ContractListResponse {
  success: boolean;
  contracts: ContractListItem[];
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
