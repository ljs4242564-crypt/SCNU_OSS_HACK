# SCNU Campus Assistant

국립순천대학교 학생이 학사일정, 장학금, 도서관, 학생지원, 부서 연락처를 자연어로 질문하면 공식 웹사이트만 검색하고 원문 근거와 출처를 함께 보여주는 모바일 우선 웹 앱입니다.

> 이 서비스는 OpenAI, GPT, Gemini, Claude 등 LLM API를 사용하지 않습니다. 질문 분석, 검색 순위, 정보 추출, 답변 생성은 키워드·정규식·점수·템플릿 규칙으로 동작합니다.

## 서비스 URL

- **Production**: https://f696bebe-457f-4f4c-842e-5b16b675cd34.vip.gensparksite.com
- **Health API**: https://f696bebe-457f-4f4c-842e-5b16b675cd34.vip.gensparksite.com/api/health
- **GitHub**: GitHub 연결 승인 후 공개 저장소 URL 추가 예정

## 해결하려는 문제

학교생활 정보가 여러 공식 홈페이지와 게시판에 흩어져 있어 학생이 직접 검색하고 최신성과 출처를 다시 확인해야 합니다. 이 프로젝트는 공식 출처 검색, 원문 검증, 정보 추출, 출처 표시를 하나의 흐름으로 연결합니다.

## 현재 완료된 기능

- React + TypeScript 모바일 우선 UI
- 5개 MVP 분야 빠른 질문
  - 학사일정
  - 장학금
  - 도서관
  - 학생지원
  - 부서 연락처
- Hono `POST /api/chat`, `GET /api/health`
- 입력 형식·크기·길이 검증
- 키워드 점수 기반 카테고리 및 질문 목적 분류
- 현재 연도·학기와 명시적 연도·학기 처리
- 카테고리별 국립순천대학교 공식 출처 검색
- 게시판 제목·작성부서·게시일·URL 수집 및 순위화
- 공식 상세 페이지 Fetch와 실제 본문 추출
- 국립순천대학교 학사일정 JSON 원문 연동
- 날짜·기간·시간·전화번호·장소 정규식 추출
- 규칙 기반 답변 템플릿
- 공식 정보 충돌 감지
- `verified`, `conflicting`, `not_found` 상태 표시
- 공식 출처, 담당 부서, 게시일, 확인일 표시
- Domain Allowlist, redirect 재검증, SSRF 방어
- CSP 및 기본 보안 헤더
- Vitest 테스트 40개
- Genspark 관리형 Cloudflare Worker 배포

## 동작 구조

```text
학생 질문
  ↓
React
  ↓ POST /api/chat
Hono API
  ↓
입력 검증 및 정규화
  ↓
규칙 기반 카테고리·의도 분석
  ↓
공식 출처 레지스트리 선택
  ↓
Domain Allowlist 검증
  ↓
국립순천대학교 공식 게시판 검색
  ↓
후보 URL 재검증
  ↓
공식 상세 페이지 또는 학사일정 API Fetch
  ↓
본문·관련 문장 추출
  ↓
날짜·시간·전화번호 등 구조화
  ↓
최신성·충돌 검사
  ↓
템플릿 답변과 공식 출처 반환
```

## API

### `GET /api/health`

```json
{
  "status": "ok",
  "service": "SCNU Campus Assistant API",
  "version": "1.0.0",
  "timestamp": "2026-09-19T14:52:50.751Z"
}
```

### `POST /api/chat`

요청:

```json
{
  "question": "이번 학기 중간고사 언제야?"
}
```

주요 응답 필드:

- `status`: `verified`, `conflicting`, `not_found`
- `analysis`: 카테고리, 질문 목적, 검색 키워드, 적용 학기
- `search`: 검색한 공식 출처와 후보
- `answer`: 템플릿 기반 답변
- `sources`: 실제 원문 확인에 사용한 공식 출처
- `meta`: 요청 ID와 처리 시각

## 기술 스택

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Lucide React

### Backend

- Hono
- TypeScript
- Cloudflare Workers
- htmlparser2

### 테스트·운영

- Vitest
- Wrangler
- PM2 로컬 미리보기
- Genspark Hosted Cloudflare

## 프로젝트 구조

```text
src/
├── index.tsx
├── routes/
│   ├── chat.ts
│   └── health.ts
├── config/
│   ├── domains.ts
│   ├── keywords.ts
│   └── sources.ts
├── services/
│   ├── answerFormatter.ts
│   ├── boardParser.ts
│   ├── contentExtractor.ts
│   ├── pageFetcher.ts
│   ├── questionAnalyzer.ts
│   └── searchService.ts
├── utils/
│   ├── domainValidator.ts
│   └── textNormalizer.ts
├── types/
│   └── pipeline.ts
├── shared/
│   └── api.ts
└── frontend/
    ├── App.tsx
    ├── main.tsx
    ├── lib/api.ts
    └── styles/index.css

tests/
├── answerFormatter.test.ts
├── boardParser.test.ts
├── chatRoute.test.ts
├── contentExtractor.test.ts
├── domainValidator.test.ts
├── pageFetcher.test.ts
├── questionAnalyzer.test.ts
└── searchService.test.ts
```

## 로컬 실행

```bash
npm install
npm run build
pm2 start ecosystem.config.cjs
```

브라우저에서 `http://localhost:3000`을 엽니다.

검증:

```bash
npm test
npx tsc --noEmit
npm audit --omit=dev
```

## 환경변수

현재 MVP는 외부 검색 API와 LLM API를 사용하지 않으므로 필수 환경변수가 없습니다. 향후 Secret이 필요하면 Cloudflare Secret으로만 저장하고 `.env`, `.dev.vars`는 Git에 올리지 않습니다.

## 공식 사이트 검색 원칙

- 서버에 등록된 국립순천대학교 공식 호스트와 경로만 요청합니다.
- 사용자 질문에 포함된 URL은 Fetch 대상으로 사용하지 않습니다.
- 검색 결과 제목만으로 답하지 않고 상세 원문을 확인합니다.
- 본문 근거를 찾지 못하면 추측하지 않습니다.
- 서로 다른 공식 정보가 충돌하면 한쪽을 임의로 선택하지 않습니다.
- 학교 페이지 안의 문장은 명령이 아니라 데이터로만 취급합니다.

## 주요 공식 출처

- `https://www.scnu.ac.kr`
- `https://library.scnu.ac.kr`
- 국립순천대학교 학사·장학·일반 공지 게시판
- 국립순천대학교 학사일정
- 국립순천대학교 조직도 및 전화번호 안내

## 보안 설계

- HTTPS 전용
- 정확한 hostname Allowlist
- 허용 경로 정규식
- username/password 포함 URL 차단
- 비표준 포트 차단
- localhost·IP 주소 차단
- redirect 매 단계 재검증
- redirect 최대 2회
- 요청 timeout 및 응답 크기 제한
- 사용자 URL 직접 Fetch 금지
- 외부 HTML을 React에 직접 삽입하지 않음
- Content Security Policy
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- API 응답 `Cache-Control: no-store`
- Production dependency 취약점 0건 확인

## 데이터 저장

현재 D1, KV, R2를 사용하지 않습니다. 사용자 질문이나 검색 기록을 영구 저장하지 않습니다.

## 배포

- 플랫폼: Genspark 관리형 Cloudflare Workers for Platform
- 상태: Active
- Worker version: `9c43f92a-dfd3-4cde-a0a1-910978f29149`
- D1: 사용하지 않음
- R2: 사용하지 않음
- KV: 사용하지 않음

배포 전 `npm test`, TypeScript 검사, 프로덕션 빌드, Wrangler 로컬 실행을 통과해야 합니다.

## 한계

- 규칙 사전에 없는 표현과 심한 오타는 분류하지 못할 수 있습니다.
- PDF, HWP, 이미지에만 있는 내용은 자동 추출하지 못할 수 있습니다.
- 도서관은 Angular 기반으로 일부 동적 내용 확인이 제한됩니다.
- 학교 HTML 구조가 변경되면 파서와 selector를 수정해야 합니다.
- 검색 요청 시점에 공식 사이트가 응답하지 않으면 `not_found`로 안내할 수 있습니다.
- 별도의 요청 횟수 제한 저장소는 아직 사용하지 않습니다.
- 이 프로젝트는 국립순천대학교 공식 서비스가 아닌 학생 프로젝트입니다.

## 향후 개선

- PDF 텍스트 추출
- HWP/HWPX 지원 검토
- 도서관 공개 API 또는 동적 데이터 어댑터
- D1 기반 단기 검색 캐시
- 오타·동의어 사전 확장
- 학생식당, 기숙사, 셔틀버스, 휴복학, 졸업, 증명서
- 관리자용 공식 출처 상태 점검
- 접근성 및 실제 학생 사용성 테스트

## 라이선스

코드는 [MIT License](./LICENSE)로 배포합니다. 국립순천대학교의 명칭, 로고, 공식 웹페이지 콘텐츠에 대한 권리는 해당 기관에 있습니다.
