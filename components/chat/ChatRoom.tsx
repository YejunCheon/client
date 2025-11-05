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
  onSend?: (text: string) => void;
}

export default function ChatRoom({ messages = [], onSend }: ChatRoomProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const text = inputValue.trim();
    setInputValue("");

    // onSend 콜백 호출 (실제 API로 메시지 전송)
    if (onSend) {
      onSend(text);
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
    <div className="bg-[#f9f9f9] rounded-[27px] w-full h-full flex flex-col" data-name="chat UI" data-node-id="92:1587">
      <div className="flex flex-col h-full" data-node-id="92:1588">
        {/* 메시지 영역 */}
        <div className="flex-1 flex flex-col gap-[12px] overflow-y-auto px-4 py-6" data-name="chat area" data-node-id="92:1589">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#acacac] text-[16px]">
              메시지가 없습니다.
            </div>
          ) : (
            messages.map((message) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 입력 필드 영역 (하단 고정) */}
        <div className="flex-shrink-0 bg-[#f2f2f2] border-t border-[#dedede] border-solid flex h-[56px] items-center justify-between px-[16px] py-[8px] rounded-b-[27px]" data-name="message input field" data-node-id="92:1610">
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

