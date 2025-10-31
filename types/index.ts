export * from './user';
export * from './chat';
export * from './product';
export * from './contract';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

