# DealChain Client

AI 기반 중고거래 계약서 자동 생성 및 전자서명 플랫폼 클라이언트 애플리케이션

## 🚀 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- 백엔드 서버 (포트 8080에서 실행 중이어야 함)

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 📦 주요 기능

- ✅ 회원가입 / 로그인
- ✅ 상품 등록 및 조회
- ✅ 실시간 채팅
- ✅ AI 기반 계약서 생성
- ✅ 전자서명
- ✅ 본인인증 (SMS)
- ✅ 계약서 PDF 다운로드

## 🛠 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI
- **State**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **Realtime**: Socket.IO Client
- **HTTP**: Axios
- **Security**: DOMPurify (XSS 방지)

## 📁 프로젝트 구조

```
client/
├── app/                    # Next.js App Router 페이지
├── components/             # 재사용 가능한 컴포넌트
├── lib/                    # 유틸리티 및 설정
├── hooks/                  # 커스텀 React 훅
├── types/                  # TypeScript 타입 정의
└── public/                 # 정적 자산
```

자세한 내용은 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요.

## 🔧 스크립트

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 시작
npm run lint     # ESLint 검사
```

## 🔐 환경 변수

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
NEXT_PUBLIC_ENV=development
```

## 📚 문서

- [아키텍처 문서](./ARCHITECTURE.md)
- [API 명세서](../docs/API%20명세서%20299e473258e480aea0f7fd3ba75e671d.md)
- [페이지 명세서](../docs/pages.md)
- [기술 스펙](../docs/tech_spec.md)

## 🤝 기여하기

이슈를 등록하거나 Pull Request를 제출해 기여해주세요.

## 📄 라이선스

MIT
