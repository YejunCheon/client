# DealChain 클라이언트 아키텍처 문서

## 📋 목차
1. [개요](#개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [아키텍처 패턴](#아키텍처-패턴)
5. [데이터 흐름](#데이터-흐름)
6. [보안 고려사항](#보안-고려사항)
7. [성능 최적화](#성능-최적화)

---

## 개요

DealChain은 AI 기반 중고거래 계약서 자동 생성 및 전자서명 플랫폼입니다. Next.js 15 App Router를 기반으로 구축되었으며, 실시간 채팅, 계약서 관리, 전자서명 등의 핵심 기능을 제공합니다.

### 핵심 요구사항
- 실시간 채팅 통신 (WebSocket/STOMP)
- AI 기반 계약서 생성 및 요약
- 전자서명 기능
- 본인인증 흐름
- 계약서 PDF 다운로드
- 보안 (XSS 방지, JWT 인증)
- 반응형 디자인

---

## 기술 스택

### Core Framework
- **Next.js 15** (App Router)
  - React Server Components
  - 파일 기반 라우팅
  - 자동 코드 스플리팅
  - 서버 사이드 렌더링

### Language & Type Safety
- **TypeScript**
  - 엄격한 타입 체크
  - 개발 시 에러 감지

### Styling
- **Tailwind CSS v4**
  - 유틸리티 우선 CSS 프레임워크
  - 커스텀 디자인 시스템

### UI Components
- **shadcn/ui** (Radix UI 기반)
  - 접근성 준수
  - 모듈러 컴포넌트
  - 커스터마이징 가능

### 상태 관리
- **TanStack Query (React Query)**
  - 서버 상태 관리
  - 자동 캐싱 및 동기화
  - 낙관적 업데이트
  
- **Zustand**
  - 클라이언트 로컬 상태
  - 경량 상태 관리 라이브러리

### 폼 및 검증
- **React Hook Form**
  - 성능 최적화된 폼 관리
  
- **Zod**
  - 스키마 기반 검증
  - TypeScript와 완벽 통합

### 실시간 통신
- **Socket.IO Client**
  - WebSocket 기반 실시간 통신
  - 자동 재연결
  - STOMP 프로토콜 지원

### 기타 라이브러리
- **Axios**: HTTP 클라이언트
- **DOMPurify**: XSS 방지
- **@react-pdf/renderer**: PDF 미리보기
- **dayjs**: 날짜 처리
- **class-variance-authority**: 컴포넌트 variant 관리
- **lucide-react**: 아이콘

---

## 프로젝트 구조

```
client/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지 (group)
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── dashboard/                # 대시보드
│   ├── product/                  # 상품 관련
│   │   ├── list/
│   │   ├── create/
│   │   └── [id]/
│   ├── chat/                     # 채팅 관련
│   │   ├── list/
│   │   └── [roomId]/
│   ├── contracts/                # 계약서 관련
│   │   ├── create/
│   │   ├── [id]/
│   │   ├── [id]/preview/
│   │   └── [id]/complete/
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 홈 페이지
│   └── globals.css               # 전역 스타일
│
├── components/                   # 재사용 가능한 컴포넌트
│   ├── ui/                       # 기본 UI 컴포넌트
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── forms/                    # 폼 컴포넌트
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── ...
│   ├── chat/                     # 채팅 관련 컴포넌트
│   │   ├── chat-room.tsx
│   │   ├── message-list.tsx
│   │   └── ...
│   ├── signature/                # 전자서명 컴포넌트
│   │   ├── signature-pad.tsx
│   │   └── ...
│   ├── pdf/                      # PDF 관련 컴포넌트
│   │   ├── pdf-viewer.tsx
│   │   └── ...
│   └── contracts/                # 계약서 컴포넌트
│       ├── contract-form.tsx
│       └── ...
│
├── lib/                          # 유틸리티 및 설정
│   ├── api/                      # API 레이어
│   │   ├── index.ts              # API Registry & 모드 전환
│   │   ├── http-client.ts        # Axios 기반 HTTP 클라이언트
│   │   ├── members.ts            # 회원 API 모듈
│   │   ├── products.ts           # 상품 API 모듈
│   │   ├── contracts.ts          # 계약 API 모듈
│   │   ├── chat.ts               # 채팅 API 모듈
│   │   └── mock/                 # Mock API 구현
│   ├── sockets.ts                # WebSocket 관리
│   ├── utils.ts                  # 유틸리티 함수
│   ├── config.ts                 # 환경 설정
│   ├── react-query.ts            # React Query 설정
│   ├── sanitize.ts               # XSS 방지
│   ├── analytics.ts              # 이벤트 로깅
│   └── store/                    # Zustand 스토어
│       └── auth.ts
│
├── hooks/                        # 커스텀 훅
│   ├── use-contract-flow.ts      # 계약서 흐름 관리
│   ├── use-sign-pad.ts           # 전자서명 패드
│   ├── use-room-presence.ts      # 채팅방 참여자 관리
│   ├── use-auth.ts               # 인증 관련
│   └── use-products.ts           # 상품 관련
│
├── types/                        # TypeScript 타입 정의
│   ├── index.ts
│   ├── user.ts                   # 사용자 관련 타입
│   ├── chat.ts                   # 채팅 관련 타입
│   ├── product.ts                # 상품 관련 타입
│   └── contract.ts               # 계약서 관련 타입
│
├── public/                       # 정적 자산
└── package.json
```

---

## 아키텍처 패턴

### 1. 컴포넌트 계층 구조

```
Page Components (App Router)
    ↓
Feature Components (components/)
    ↓
UI Primitive Components (components/ui/)
```

**책임 분리:**
- **Pages**: 라우팅 및 데이터 페칭 조율
- **Feature Components**: 비즈니스 로직 포함
- **UI Components**: 순수한 프레젠테이션 컴포넌트

### 2. 데이터 페칭 전략

**서버 상태 (TanStack Query)**
- 모든 백엔드 API 호출
- 자동 캐싱 및 동기화
- 낙관적 업데이트
- 에러 핸들링

**클라이언트 상태 (Zustand)**
- 인증 정보
- UI 상태 (모달, 사이드바)
- 로컬 폼 상태

### 3. 상태 관리 흐름

```
User Action
    ↓
Zustand Store (Auth State)
    ↓
API Client (Axios)
    ↓
TanStack Query (Server State)
    ↓
UI Update
```

### 4. 실시간 통신 패턴

**WebSocket 연결 관리**
```typescript
// 싱글톤 패턴으로 SocketManager 구현
socketManager.connect() → Socket 인스턴스
socketManager.disconnect() → 연결 종료
```

**STOMP 메시지 처리**
```typescript
// 구독: /sub/chat/room/{roomId}
// 발행: /pub/chat/message
```

---

## 데이터 흐름

### 1. 인증 흐름

```
1. 사용자 로그인 시도
    ↓
2. apiClient.post('/api/members/login')
    ↓
3. JWT 토큰 수신
    ↓
4. LocalStorage에 토큰 저장
    ↓
5. Zustand Auth Store 업데이트
    ↓
6. HTTP 헤더에 토큰 자동 추가
```

### 2. 채팅 메시지 흐름

```
전송:
1. 사용자 메시지 입력
    ↓
2. useRoomPresence 훅
    ↓
3. Socket.IO emit('chat', message)
    ↓
4. 서버로 전송 (/pub/chat/message)

수신:
1. Socket.IO subscribe('/sub/chat/room/{roomId}')
    ↓
2. 실시간 메시지 수신
    ↓
3. React Query cache 업데이트
    ↓
4. UI 자동 리렌더링
```

### 3. 계약서 생성 흐름

```
1. 채팅방에서 "계약서 생성" 클릭
    ↓
2. AI 초안 생성 요청 (POST /api/ai/contracts/generate)
    ↓
3. 초안 표시 및 수정
    ↓
4. 판매자 검토 및 서명
    ↓
5. 본인인증 (SMS)
    ↓
6. 서명 제출 (POST /api/contracts/sign/{id})
    ↓
7. PDF 생성 및 암호화 저장
    ↓
8. 구매자에게 알림
```

---

## 보안 고려사항

### 1. XSS 방지
```typescript
// DOMPurify로 사용자 입력 sanitize
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

### 2. JWT 인증
- **토큰 저장**: `localStorage` (클라이언트 전용)
- **자동 헤더 추가**: Axios Interceptor
- **401 에러 처리**: 자동 로그아웃

### 3. HTTPS
- 프로덕션 환경에서 HTTPS 필수
- 민감 정보 전송 시 암호화

### 4. Content Security Policy
```typescript
// next.config.ts
headers: [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
      }
    ]
  }
]
```

### 5. 입력 검증
- Zod 스키마로 모든 사용자 입력 검증
- 클라이언트 및 서버 양쪽에서 검증

---

## 성능 최적화

### 1. 코드 스플리팅
- Next.js 자동 코드 스플리팅
- Route-based 분할
- Dynamic Import 활용

### 2. 이미지 최적화
```typescript
import Image from 'next/image';

// Next.js Image 컴포넌트 사용
// 자동 WebP 변환, 레이지 로딩
```

### 3. 캐싱 전략
**React Query 캐싱**
- staleTime: 1분
- gcTime: 5분
- Background refetch

**Static Generation**
- 상품 목록 페이지: ISR (Incremental Static Regeneration)
- 계약서 상세: SSR (Server Side Rendering)

### 4. 번들 분석
```bash
npm run build
# .next/analyze 디렉토리에 번들 분석 결과
```

---

## 주요 패턴 및 베스트 프랙티스

### 1. 커스텀 훅 패턴
```typescript
// 데이터 페칭 로직을 커스텀 훅으로 추상화
const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.get('/api/product/list'),
  });
};
```

### 2. Error Boundary
```typescript
// 상위 레벨 에러 핸들링
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### 3. Loading States
- Suspense 경계 설정
- 스켈레톤 UI 제공
- 프로그레스 인디케이터

### 4. 타입 안전성
- 모든 API 응답 타입 정의
- Zod 스키마로 런타임 검증
- TypeScript strict 모드 활성화

---

## 환경 변수

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
NEXT_PUBLIC_ENV=development
```

---

## 개발 워크플로우

### 1. 로컬 개발
```bash
npm run dev        # 개발 서버 시작
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버
npm run lint       # ESLint 검사
```

### 2. Git Workflow
```
main (production)
  ↓
develop (development)
  ↓
feature/* (feature branches)
```

---

## 참고 문서

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 향후 개선사항

1. **PWA 지원**: 오프라인 기능 추가
2. **다국어 지원**: next-intl 통합
3. **성능 모니터링**: Sentry 또는 DataDog
4. **E2E 테스트**: Playwright 또는 Cypress
5. **Visual Testing**: Percy 또는 Chromatic
6. **접근성 향상**: Lighthouse 점수 100점 달성

---

## 결론

DealChain 클라이언트는 **현대적인 React 아키텍처**와 **견고한 보안**을 기반으로 구축되었습니다. 

핵심 원칙:
- ✅ 타입 안전성 (TypeScript)
- ✅ 상태 관리 분리 (React Query + Zustand)
- ✅ 컴포넌트 재사용성
- ✅ 보안 우선
- ✅ 성능 최적화
- ✅ 접근성 준수

이 아키텍처는 **확장 가능성**과 **유지보수성**을 최우선으로 설계되었습니다.
