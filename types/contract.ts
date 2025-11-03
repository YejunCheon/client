// 계약서 데이터 구조 (POST /create 응답의 data 필드)
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

// 계약서 생성 요청 (POST /create)
export interface CreateContractRequest {
  sellerId: string;
  buyerId: string;
  roomId?: string;
  deviceInfo?: string;
}

// 계약서 생성 응답 (POST /create)
export interface CreateContractResponse {
  success: boolean;
  data: string; // JSON 형태의 계약서 데이터 (ContractData를 JSON.stringify한 것)
}

// 계약서 조회 응답 (GET /{id}) - PDF 반환
// 실제로는 Blob이나 ArrayBuffer를 받지만, 타입은 별도로 처리할 수 있음

// 계약서 수정 요청 (PUT /{id})
export interface UpdateContractRequest {
  pdf: Blob | File | string; // PDF 파일
}

// 서명 요청 (POST /sign)
export interface SignContractRequest {
  roomId: string;
  productId: number;
  contract: string; // JSON 내용
  deviceInfo?: string;
}

// 서명 응답 (POST /sign)
export interface SignContractResponse {
  isSuccess: boolean;
  data: string; // 오류 정보
  bothSign: boolean; // 둘 다 서명했는지
}


// 기존 계약서 타입 (리스트나 다른 용도)
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

export interface ContractListItem {
  id: string;
  roomId?: string;
  sellerId: string;
  buyerId: string;
  productId?: string;
  summary?: string;
  status: ContractStatus;
  updatedAt?: string;
}

export interface ContractListResponse {
  contracts: ContractListItem[];
  success: boolean;
  message?: string;
  count?: number;
}

