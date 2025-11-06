import { useEffect, useState, useCallback, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Notification, NotificationMessage } from "@/types/notification";
import { config as appConfig } from "@/lib/config";
import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/store/auth";

/**
 * 알림 관리 훅
 * '/user/queue/notifications' 경로를 구독하여 개인 알림을 수신합니다.
 */
export function useNotification(userId: string | number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // localStorage에서 알림 불러오기
  useEffect(() => {
    if (!userId) return;

    const stored = localStorage.getItem(`notifications_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.isRead).length);
      } catch (error) {
        console.error("[useNotification] Failed to parse stored notifications:", error);
      }
    }
  }, [userId]);

  // localStorage에 알림 저장
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications, userId]);

  // WebSocket 연결 및 알림 구독
  useEffect(() => {
    if (!userId) {
      console.log("[useNotification] No userId provided, skipping connection");
      return;
    }

    console.log("[useNotification] Connecting to notification service for user:", userId);

    // 토큰 가져오기
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) {
      console.warn("[useNotification] No auth token found");
      return;
    }

    const client = new Client({
      webSocketFactory: () => {
        console.log("[useNotification] Creating SockJS connection...");
        return new SockJS(appConfig.wsUrl, null, {
          transports: ["websocket", "xhr-streaming", "xhr-polling"],
          timeout: 10000,
        }) as any;
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[useNotification STOMP Debug]", str);
        }
      },
      onConnect: () => {
        console.log("[useNotification] Connected to notification service");
        setIsConnected(true);

        // 개인 알림 큐 구독
        const subscriptionPath = "/user/queue/notifications";
        console.log("[useNotification] Subscribing to:", subscriptionPath);

        client.subscribe(subscriptionPath, (message: IMessage) => {
          console.log("[useNotification] Received notification:", message.body);

          try {
            const notificationMessage: NotificationMessage = JSON.parse(message.body);

            const newNotification: Notification = {
              id: crypto.randomUUID(),
              type: notificationMessage.type,
              title: notificationMessage.title,
              message: notificationMessage.message,
              timestamp: notificationMessage.timestamp || Date.now(),
              isRead: false,
              metadata: notificationMessage.metadata,
            };

            console.log("[useNotification] Created notification:", newNotification);

            setNotifications((prev) => [newNotification, ...prev]);

            // 브라우저 알림 표시 (권한이 있는 경우)
            if (Notification.permission === "granted") {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: "/favicon.ico",
              });
            }
          } catch (error) {
            console.error("[useNotification] Failed to parse notification:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[useNotification] STOMP error:", frame);
        setIsConnected(false);
      },
      onWebSocketError: (event) => {
        console.error("[useNotification] WebSocket error:", event);
        setIsConnected(false);
      },
      onDisconnect: () => {
        console.log("[useNotification] Disconnected from notification service");
        setIsConnected(false);
      },
    });

    clientRef.current = client;

    try {
      client.activate();
    } catch (error) {
      console.error("[useNotification] Failed to activate client:", error);
    }

    return () => {
      console.log("[useNotification] Cleaning up notification connection");
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [userId]);

  // 알림을 읽음으로 표시
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  // 알림 삭제
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // 모든 알림 삭제
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      console.log("[useNotification] Notification permission:", permission);
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestNotificationPermission,
  };
}
