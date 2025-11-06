"use client";

import React, { useEffect, useRef } from "react";
import { Notification, NotificationType } from "@/types/notification";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
}

// 알림 타입별 아이콘
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "CONTRACT_REQUEST":
      return "📄";
    case "CONTRACT_REJECT":
      return "❌";
    case "WARNING_FRAUD":
      return "⚠️";
    case "SIGN_REQUEST":
      return "✍️";
    default:
      return "🔔";
  }
};

// 알림 타입별 색상
const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "CONTRACT_REQUEST":
      return "bg-blue-50 border-blue-200";
    case "CONTRACT_REJECT":
      return "bg-red-50 border-red-200";
    case "WARNING_FRAUD":
      return "bg-yellow-50 border-yellow-200";
    case "SIGN_REQUEST":
      return "bg-green-50 border-green-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

export default function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationCenterProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={modalRef}
      className="absolute top-full right-0 mt-2 w-[400px] max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold text-[#222]">알림</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[12px] font-medium bg-blue-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-[12px] text-blue-500 hover:text-blue-700 transition-colors"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="overflow-y-auto max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-[48px] mb-2">🔔</div>
            <p className="text-[14px] text-gray-500">새로운 알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? "bg-blue-50/30" : ""
                }`}
                onClick={() => {
                  onNotificationClick(notification);
                  if (!notification.isRead) {
                    onMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-[20px] border ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[14px] font-semibold text-[#222] line-clamp-1">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatDistanceToNow(notification.timestamp, {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
