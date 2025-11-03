"use client";

import React, { useState, useRef, useEffect } from "react";

const imgGroup3 = "/assets/e2c37e32f77f32c5fc92c2d4bd050ce4822bbe03.svg";

interface Message {
  id: string;
  text: string;
  senderId: string;
  isOwn: boolean;
  timestamp: string;
}

interface ChatRoomProps {
  messages?: Message[];
  onCallback?: (message: Message) => void;
}

export default function ChatRoom({ messages, onCallback }: ChatRoomProps) {
  const defaultMessages: Message[] = [
    {
      id: "1",
      text: "구매하실 생각이세요?",
      senderId: "other",
      isOwn: false,
      timestamp: "오후 2:33",
    },
    {
      id: "2",
      text: "네. 청축에 K4 맞죠?\n윤활은 된건가요?",
      senderId: "me",
      isOwn: true,
      timestamp: "오후 2:33",
    },
    {
      id: "3",
      text: "네. 맞아요. 3개월 썼습니다.",
      senderId: "other",
      isOwn: false,
      timestamp: "오후 2:33",
    },
    {
      id: "4",
      text: "네 알겠습니다. 블루투스 기능도 정상적으로 작동하나요?",
      senderId: "me",
      isOwn: true,
      timestamp: "오후 2:33",
    },
    {
      id: "5",
      text: "3개 모두 정상 작동해요~~~\n계약서 초안 보내드릴게요.",
      senderId: "other",
      isOwn: false,
      timestamp: "오후 2:33",
    },
  ];

  const [messageList, setMessageList] = useState<Message[]>(messages || defaultMessages);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // messages prop이 변경되면 상태 업데이트
  useEffect(() => {
    if (messages) {
      setMessageList(messages);
    }
  }, [messages]);

  // 메시지가 추가될 때 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // 현재 시간 포맷팅
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? "오후" : "오전";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${period} ${displayHours}:${minutes.toString().padStart(2, "0")}`;
  };

  // 메시지 전송
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      senderId: "me",
      isOwn: true,
      timestamp: getCurrentTime(),
    };

    const updatedMessages = [...messageList, newMessage];
    setMessageList(updatedMessages);
    setInputValue("");

    // onCallback 호출
    if (onCallback) {
      onCallback(newMessage);
    }

    // 입력 필드에 포커스
    inputRef.current?.focus();
  };

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-[#f9f9f9] overflow-clip rounded-[27px] w-full max-w-[900px] min-h-[600px] flex items-center justify-center py-8 mx-auto" data-name="chat UI" data-node-id="92:1587">
      <div className="flex flex-col gap-[28px] items-center w-full max-w-[850px] px-4" data-node-id="92:1588">
        <div className="flex flex-col gap-[12px] items-center w-full overflow-y-auto max-h-[600px] px-2" data-name="chat area" data-node-id="92:1589">
          {messageList.map((message) => (
            <div
              key={message.id}
              className={`flex gap-[4px] items-end w-full ${message.isOwn ? "justify-end" : "justify-start"}`}
              data-name={message.isOwn ? "my chat" : "other's chat"}
            >
              {!message.isOwn && (
                <div className="bg-[#f2f2f2] box-border flex gap-[10px] items-center px-[20px] py-[16px] rounded-[15px]" data-node-id="92:1591">
                  <div className="text-[16px] text-[#2b2b2b] max-w-[224px]" data-node-id="92:1592">
                    <p className="leading-[24px] whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col justify-end text-[13px] text-[#acacac] whitespace-nowrap" data-node-id="92:1593">
                <p className="leading-[18px]">{message.timestamp}</p>
              </div>
              {message.isOwn && (
                <div className="bg-[#222222] box-border flex gap-[10px] items-center px-[20px] py-[16px] rounded-[15px]" data-node-id="92:1596">
                  <div className="text-[16px] text-[#f9f9f9] max-w-[260px]" data-node-id="92:1597">
                    <p className="leading-[24px] whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="bg-[#f2f2f2] border border-[#dedede] border-solid flex h-[56px] items-center justify-between px-[16px] py-[8px] rounded-[16px] w-full" data-name="message input field" data-node-id="92:1610">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요"
            className="flex-grow bg-transparent outline-none text-[16px] text-[#2b2b2b] placeholder:text-[#acacac] font-['Noto_Sans_KR:Medium',sans-serif] font-medium leading-[1.5] mr-3"
            data-node-id="92:1611"
          />
          <div
            onClick={handleSendMessage}
            className="bg-[#222222] flex items-center justify-center px-[10px] py-[10px] rounded-[13px] w-[36px] h-[36px] cursor-pointer hover:bg-[#333333] transition-colors"
            data-node-id="92:1612"
          >
            <div className="h-[18px] relative shrink-0 w-[14px]" data-node-id="92:1613">
              <div className="absolute bottom-0 left-[-12.73%] right-[-12.73%] top-[-7.52%]">
                <img alt="send" className="block max-w-none size-full" src={imgGroup3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

