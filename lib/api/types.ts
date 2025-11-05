import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  GetMemberResponse,
} from '@/types/user';
import type {
  CreateProductPayload,
  CreateProductResponse,
  DeleteProductResponse,
  MemberProductResponse,
  ProductListResponse,
  ProductResponse,
} from '@/types/product';
import type {
  ContractCreateRequest,
  ContractCreateResponse,
  ContractDeleteResponse,
  ContractListResponse,
  ContractDetailParams,
  ContractDetailResponse,
  ContractEditRequest,
  ContractSignRequest,
  ContractSignResponse,
  ContractSearchRequest,
  ContractSearchResponse,
  ContractRejectRequest,
  ContractSendRequest,
  ContractSendResponse,
  ContractUploadPayload,
  ContractUploadResponse,
} from '@/types/contract';
import type {
  ChatMessagesRequest,
  ChatMessagesResponse,
  ChatRoomListResponse,
  ChatRoomRequest,
  ChatRoomResponse,
  ContractRequestRequest,
  ContractRequestResponse,
} from '@/types/chat';

export interface MembersApi {
  register(payload: RegisterRequest): Promise<RegisterResponse>;
  login(payload: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<LogoutResponse>;
  getProfile(memberId: number): Promise<GetMemberResponse>;
  getSignature(memberId: number): Promise<Blob>;
}

export interface ProductsApi {
  create(payload: CreateProductPayload): Promise<CreateProductResponse>;
  remove(productId: number): Promise<DeleteProductResponse>;
  get(productId: number): Promise<ProductResponse>;
  list(): Promise<ProductListResponse>;
  listByMember(memberId: number): Promise<MemberProductResponse>;
}

export interface ContractsApi {
  list(params?: { roomId?: string }): Promise<ContractListResponse>;
  create(payload: ContractCreateRequest): Promise<ContractCreateResponse>;
  sign(payload: ContractSignRequest): Promise<ContractSignResponse>;
  search(payload: ContractSearchRequest): Promise<ContractSearchResponse>;
  reject(payload: ContractRejectRequest): Promise<ContractSendResponse>;
  edit(payload: ContractEditRequest): Promise<ContractSearchResponse>;
  send(payload: ContractSendRequest): Promise<ContractSendResponse>;
  detail(params: ContractDetailParams): Promise<ContractDetailResponse>;
  upload?(payload: ContractUploadPayload): Promise<ContractUploadResponse>;
  delete(contractId: number | string): Promise<ContractDeleteResponse>;
}

export interface ChatApi {
  createRoom(payload: ChatRoomRequest): Promise<ChatRoomResponse>;
  getMessages(payload: ChatMessagesRequest): Promise<ChatMessagesResponse>;
  getRooms(payload: { userId: number | string }): Promise<ChatRoomListResponse>;
  requestContractCreation(payload: ContractRequestRequest): Promise<ContractRequestResponse>;
}

export interface ApiRegistry {
  members: MembersApi;
  products: ProductsApi;
  contracts: ContractsApi;
  chat: ChatApi;
}

export type ApiMode = 'http' | 'mock';
