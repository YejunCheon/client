/**
 * 알림 타입 정의
 */

export type NotificationType =
  | 'CONTRACT_REQUEST'      // 구매자가 계약서 생성 요청
  | 'CONTRACT_REJECT'       // 구매자가 계약서 거절
  | 'WARNING_FRAUD'         // AI 위험 경고
  | 'SIGN_REQUEST';         // 구매자가 판매자에게 서명 요청

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  metadata?: {
    roomId?: string;
    contractId?: string;
    userId?: string;
    productId?: string;
    [key: string]: any;
  };
}

export interface NotificationMessage {
  type: NotificationType;
  userId: string | number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}
