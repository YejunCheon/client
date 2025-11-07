import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { config as appConfig } from '@/lib/config';
import { useAuthStore } from '@/lib/store/auth';

export interface HttpClient {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T>;
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T>;
  delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T>;
  postMultipart<T = unknown>(url: string, data: FormData): Promise<T>;
  getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob>;
}

export interface AuthHttpClient extends HttpClient {
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}

class AxiosHttpClient implements AuthHttpClient {
  private readonly client: AxiosInstance;
  private readonly baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || appConfig.apiUrl;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url ?? '';
        
        if (status === 401) {
          const shouldSkip =
            url.includes('/auth') ||
            url.includes('/login') ||
            url.includes('/members/');

          if (!shouldSkip) {
            this.handleUnauthorized('세션이 만료되었습니다. 다시 로그인해주세요.');
          }
        } else if (status === 403) {
          // 403 Forbidden: 권한이 없는 경우
          const errorData = error.response?.data;
          const errorMessage = 
            (typeof errorData === 'object' && errorData !== null && 'message' in errorData)
              ? (errorData as { message?: string }).message
              : typeof errorData === 'string'
              ? errorData
              : '해당 리소스에 접근할 권한이 없습니다.';
          
          console.error('[HTTP Client] 403 Forbidden:', {
            url,
            method: error.config?.method,
            message: errorMessage,
            data: errorData,
            requestData: error.config?.data,
          });
          
          // 특정 API는 조용히 처리 (예: 계약서 상세 조회 등)
          // 이 경우 호출하는 쪽에서 에러를 처리하도록 함
          const shouldSilentFail = 
            url.includes('/contracts/detail') ||
            url.includes('/contracts/search') ||
            url.includes('/contracts/edit');
          
          if (!shouldSilentFail && typeof window !== 'undefined') {
            alert(errorMessage);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private handleUnauthorized(reason?: string): void {
    void useAuthStore.getState().handleUnauthorized(reason);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async postMultipart<T>(url: string, data: FormData): Promise<T> {
    const response = await this.client.post<T>(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.client.get<Blob>(url, {
      responseType: 'blob',
      ...config,
    });
    return response.data;
  }

  setAuthToken(token: string): void {
    this.setToken(token);
  }

  clearAuthToken(): void {
    this.removeToken();
  }
}

export const httpClient: AuthHttpClient = new AxiosHttpClient();

export function createHttpClient(baseURL?: string): AuthHttpClient {
  if (!baseURL) {
    return httpClient;
  }
  return new AxiosHttpClient(baseURL);
}

export default httpClient;
