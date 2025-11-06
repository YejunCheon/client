# 환경 설정 가이드

이 프로젝트는 **MSW(Mock Service Worker)**를 활용하여 Mock API와 실제 백엔드를 쉽게 스위칭할 수 있도록 구성되어 있습니다.

## 🎯 핵심 개념

### Mock Mode (모킹 모드)
- **백엔드 연결 불필요** - MSW가 API 요청을 가로채서 fake data 반환
- 프론트엔드만으로 개발 가능
- `/mocks` 폴더의 핸들러와 mock data 사용
- 백엔드 개발 완료 전에도 프론트엔드 작업 가능

### HTTP Mode (실제 연결 모드)
- 실제 백엔드 서버와 연결
- AWS Elastic Beanstalk 환경과 통신
- 프로덕션 배포 시 사용

## 📁 환경 파일 구조

```
.env.development      # Mock API 환경 (NEXT_PUBLIC_API_MODE=mock) - Git 커밋 O
.env.production       # 실제 백엔드 환경 (NEXT_PUBLIC_API_MODE=http) - Git 커밋 O
.env.example          # 템플릿 파일 - Git 커밋 O
.env                  # 개인 설정 (사용 안 함) - Git 무시
.env.local            # 개인별 오버라이드 설정 - Git 무시
```

## 🚀 환경 스위칭 방법

### 1. Mock API로 개발 (기본, 백엔드 불필요)

```bash
npm run dev
```

**특징:**
- `.env.development` 파일 사용 (`NEXT_PUBLIC_API_MODE=mock`)
- MSW가 API 요청을 가로채서 mock data 반환
- 백엔드 서버 연결 없이 프론트엔드만으로 개발 가능
- 개발자 도구 콘솔에 `[MSW] Mock Service Worker started` 메시지 출력

**Mock 데이터 위치:**
```
/mocks/
  ├── browser.ts           # MSW worker 설정
  ├── handlers.ts          # API 핸들러 정의
  └── data/
      ├── products.ts      # 상품 mock data
      ├── contracts.ts     # 계약서 mock data
      ├── members.ts       # 회원 mock data
      └── chat.ts          # 채팅 mock data
```

### 2. 실제 백엔드로 개발 (테스트용)

개발 중에 실제 백엔드 서버로 테스트하고 싶을 때:

```bash
npm run dev:prod
```

**특징:**
- `.env.production` 파일 사용 (`NEXT_PUBLIC_API_MODE=http`)
- 실제 AWS 백엔드 서버와 연결
- MSW 비활성화
- 개발 서버는 그대로 hot-reload 지원

### 3. 프로덕션 빌드

```bash
# 프로덕션 환경으로 빌드 (기본, http mode)
npm run build

# Mock 환경 설정으로 빌드 (테스트용)
npm run build:dev
```

## 🔧 환경 변수 설명

### 핵심 변수

| 변수명 | 설명 | Mock 모드 | HTTP 모드 |
|--------|------|-----------|-----------|
| `NEXT_PUBLIC_API_MODE` | **API 모드 설정** | `mock` | `http` |
| `NEXT_PUBLIC_API_URL` | 백엔드 API 서버 주소 | 사용 안 함 | AWS 주소 |
| `NEXT_PUBLIC_WS_URL` | WebSocket 서버 주소 | 사용 안 함 | AWS 주소 |
| `NEXT_PUBLIC_ENV` | 환경 구분 | `development` | `production` |

### 기타 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NEXT_PUBLIC_VERIFY_START_URL` | 본인인증 시작 URL | Mock API 주소 |
| `NEXT_PUBLIC_VERIFY_TOKEN_TTL_SECONDS` | 본인인증 토큰 TTL | `60` |

## 🎨 Mock Data 수정하기

Mock 데이터를 수정하려면 `/mocks/data/` 폴더의 파일을 편집하세요.

**예시: 상품 데이터 추가**

```typescript
// /mocks/data/products.ts
export const mockProducts = [
  {
    id: 1,
    name: "새로운 상품",
    price: 10000,
    // ...
  },
  // 상품 추가
];
```

**예시: 새로운 API 엔드포인트 추가**

```typescript
// /mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // 기존 핸들러들...

  // 새 엔드포인트 추가
  http.get('*/api/new-endpoint', () => {
    return HttpResponse.json({
      data: "mock response",
      success: true,
    });
  }),
];
```

## 🛠️ 개인별 설정 오버라이드

팀 공유 설정을 변경하지 않고 개인별로 다른 설정을 사용하려면:

### `.env.local` 파일 생성

```bash
# .env.local 예시

# Mock 모드를 HTTP 모드로 전환
NEXT_PUBLIC_API_MODE=http

# 로컬 백엔드 서버 사용
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

**우선순위**: `.env.local` > `.env.development` / `.env.production` > `.env`

## ⚙️ 새로운 환경 변수 추가하기

1. `.env.development`, `.env.production`, `.env.example`에 모두 추가
2. `lib/config.ts`에 타입과 함께 추가
3. `lib/api.ts`에 필요 시 헬퍼 함수 추가
4. 팀원들에게 새 환경 변수 추가를 공유

**예시:**

```typescript
// lib/config.ts
export const config = {
  // 기존 설정...
  newFeatureUrl: process.env.NEXT_PUBLIC_NEW_FEATURE_URL || '',
} as const;
```

## ⚠️ 주의사항

- **민감한 정보 (API 키, 시크릿)는 `.env.local`에만 저장하세요**
- `.env.development`와 `.env.production`은 팀이 공유하는 기본 설정입니다
- **환경 변수 변경 후에는 개발 서버를 재시작해야 합니다**
- `NEXT_PUBLIC_` 접두사가 있는 변수만 브라우저에서 접근 가능합니다

## 🔍 디버깅

### MSW가 작동하는지 확인

브라우저 개발자 도구 콘솔에서 확인:

```
[MSW] Mock Service Worker started
```

이 메시지가 보이면 Mock 모드가 정상 작동 중입니다.

### 현재 API 모드 확인

브라우저 콘솔에서 실행:

```javascript
console.log('API Mode:', process.env.NEXT_PUBLIC_API_MODE);
```

## 🐛 트러블슈팅

### 환경 변수가 적용되지 않을 때

1. **개발 서버 재시작**
   ```bash
   # Ctrl+C로 중지 후
   npm run dev
   ```

2. **빌드 캐시 삭제 후 재시작**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Mock API가 작동하지 않을 때

1. 브라우저 콘솔에서 `[MSW]` 로그 확인
2. `.env.development` 파일에서 `NEXT_PUBLIC_API_MODE=mock` 확인
3. `/mocks/handlers.ts`에서 해당 API 엔드포인트가 정의되어 있는지 확인
4. Service Worker 등록 확인: 개발자 도구 > Application > Service Workers

### HTTP 모드에서 CORS 에러 발생 시

`next.config.ts`의 프록시 설정이 올바른지 확인:

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${apiServer}/api/:path*`,
    },
  ];
}
```

## 📋 빠른 참조

| 목적 | 명령어 | API 모드 | 백엔드 연결 |
|------|--------|----------|------------|
| Mock API로 개발 (기본) | `npm run dev` | mock | 불필요 ❌ |
| 실제 백엔드로 개발 | `npm run dev:prod` | http | 필요 ✅ |
| 프로덕션 빌드 | `npm run build` | http | 필요 ✅ |
| Mock으로 빌드 (테스트) | `npm run build:dev` | mock | 불필요 ❌ |
| 개인 설정 사용 | `.env.local` 파일 생성 | 커스텀 | 커스텀 |

## 💡 추천 워크플로우

1. **프론트엔드 개발 초기**: Mock 모드로 개발 (`npm run dev`)
2. **백엔드 연동 테스트**: HTTP 모드로 전환 (`npm run dev:prod`)
3. **프로덕션 배포**: HTTP 모드로 빌드 (`npm run build`)

이렇게 하면 백엔드 개발 완료를 기다리지 않고 프론트엔드 작업을 진행할 수 있습니다!
