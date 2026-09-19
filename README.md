# SCNU Campus Assistant

국립순천대학교 학생들이 학사일정, 장학금, 도서관, 학생지원, 부서 연락처를 여러 홈페이지에서 직접 찾지 않아도 되도록 돕는 모바일 우선 웹 애플리케이션입니다.

이 프로젝트는 학교 정보를 임의로 생성하지 않습니다. 향후 Hono API가 국립순천대학교 공식 웹페이지를 확인하고, 규칙 기반으로 필요한 정보를 추출하여 출처와 함께 안내합니다. OpenAI, Gemini, Claude 등 LLM API는 서비스에 포함하지 않습니다.

## 해결하려는 문제

- 학교생활 정보가 여러 공식 홈페이지와 게시판에 분산되어 있습니다.
- 학생이 최신 공지와 과거 공지를 직접 구분해야 합니다.
- 검색 결과의 출처와 담당 부서를 다시 확인해야 합니다.

SCNU Campus Assistant는 공식 출처 확인, 원문 검토, 구조화된 결과 표시 과정을 하나의 화면으로 연결하는 것을 목표로 합니다.

## 현재 개발 상태

**Phase 5 — 국립순천대학교 공식 사이트 검색 후보 수집 완료**

### 현재 완료된 기능

- React + TypeScript 클라이언트 구성
- Tailwind CSS 빌드 구성
- Lucide 아이콘 적용
- 모바일 우선 반응형 랜딩 화면
- 5개 MVP 분야 빠른 질문 카드
  - 학사일정
  - 장학금
  - 도서관
  - 학생지원
  - 부서 연락처
- 질문 입력, 160자 제한, 빈 입력 검증
- 인기 질문 선택 기능
- 검색 결과 카드 미리보기
- 키보드 포커스 및 스크린 리더용 레이블
- Hono가 React 앱 셸과 정적 Assets 제공
- `GET /api/health` 서비스 상태 확인
- `POST /api/chat` 질문 접수 및 서버 입력 검증
- JSON 형식, Content-Type, 요청 크기, 질문 타입 및 길이 검증
- 공통 API 요청·응답 TypeScript 타입
- 일관된 JSON 오류 응답과 요청 식별자
- React 질문 폼과 Hono API 연결
- API 요청 중 로딩 및 네트워크 오류 표시
- 5개 MVP 분야 키워드 설정
- 질문 공백·제어문자·반복 문장부호 정규화
- 강한 키워드와 연관 키워드의 점수 기반 분류
- 일정·신청·운영시간·연락처·방법·장소 의도 분류
- 현재 연도·학기 및 명시적 연도·학기 해석
- 공식 사이트 검색어 후보 생성
- 모호한 질문 및 지원 범위 밖 질문 처리
- Vitest 기반 질문 분석 및 API 회귀 테스트
- 카테고리별 공식 출처 레지스트리
- 국립순천대학교 학사·장학·일반 공지 게시판 검색
- 도서관·전화번호 안내 공식 페이지 후보 제공
- 공식 게시판 HTML 목록 파싱
- 후보 제목·URL·작성부서·게시일 수집
- 키워드·적용 연도·학기 기반 후보 점수화
- 오래된 자료 및 OCU·학점교류 등 특수 자료 감점
- 출처·검색어·후보 수·응답 크기·시간 제한
- React에서 원문 확인 전 검색 후보 표시
- Vitest 테스트 총 21개

현재 API는 공식 사이트에서 검색 후보를 수집합니다. 후보 상세 페이지의 실제 본문 검증은 아직 실행하지 않습니다.

### 아직 구현하지 않은 기능

- 중앙화된 Domain Allowlist 및 redirect 검증
- 공식 페이지 Fetch 및 본문 추출
- 날짜, 기간, 시간, 전화번호 추출
- 최신성 및 충돌 판단
- 템플릿 답변 생성
- 실제 공식 출처 연결
- Cloudflare 운영 배포

## 현재 URI

| Method | Path | 설명 |
|---|---|---|
| GET | `/` | React 기반 메인 화면 |
| GET | `/api/health` | API 상태, 버전, 서버 시각 확인 |
| POST | `/api/chat` | `{ "question": "질문" }` 접수 및 검증 |
| GET | `/static/client.js` | 빌드된 React 클라이언트 |
| GET | `/static/client.css` | 빌드된 스타일시트 |

`POST /api/chat`은 질문 분석 결과를 `analysis`, 공식 검색 후보를 `search` 필드에 담아 반환합니다. 상세 페이지 원문 검증 전이므로 전체 상태는 아직 `pending`입니다.

## 기술 스택

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Lucide React
- htmlparser2

### Backend 및 배포 기반

- Hono
- TypeScript
- Cloudflare Workers / Pages
- Wrangler

### 저장소

현재 D1, KV, R2를 사용하지 않습니다. MVP 규칙과 공식 출처 목록은 TypeScript 설정 파일에서 관리할 예정입니다.

## 현재 구조

```text
src/
├── index.tsx                    # Hono 진입점, API 연결, React HTML 셸
├── renderer.tsx                 # 초기 Hono 템플릿 렌더러(현재 미사용)
├── config/
│   ├── keywords.ts              # 카테고리·의도 키워드 규칙
│   └── sources.ts               # 공식 검색 출처와 요청 제한
├── routes/
│   ├── chat.ts                  # 질문 검증, 분석, 임시 응답
│   └── health.ts                # API 상태 확인
├── services/
│   ├── questionAnalyzer.ts      # 점수 기반 질문 분석기
│   ├── searchService.ts         # 공식 게시판 검색과 후보 점수화
│   └── boardParser.ts           # 게시판 목록 HTML 파서
├── shared/
│   └── api.ts                   # 프론트엔드·백엔드 공통 API 타입
├── utils/
│   └── textNormalizer.ts        # 질문 문자열 정규화
└── frontend/
    ├── main.tsx                 # React 마운트 지점
    ├── App.tsx                  # 메인 화면과 API 요청 상태
    ├── lib/
    │   └── api.ts               # Hono API 호출과 오류 변환
    └── styles/
        └── index.css            # Tailwind 및 반응형 디자인

ecosystem.config.cjs             # PM2 기반 로컬 미리보기 설정
vite.config.ts                   # React 클라이언트와 Worker 이중 빌드
wrangler.jsonc                   # Cloudflare Pages 설정
tests/
├── questionAnalyzer.test.ts     # 질문 분석 단위 테스트
├── chatRoute.test.ts            # 채팅 API 회귀 테스트
├── searchService.test.ts        # 검색 서비스 테스트
└── boardParser.test.ts          # 게시판 HTML 파서 테스트
```

백엔드 기능을 구현하면서 `routes`, `services`, `config`, `utils`, `types`, `tests` 디렉터리를 필요한 시점에 추가합니다.

## 로컬 실행

### 요구사항

- Node.js
- npm
- PM2

### 설치 및 빌드

```bash
npm install
npm run build
```

### 로컬 미리보기

```bash
pm2 start ecosystem.config.cjs
```

브라우저에서 다음 주소를 엽니다.

```text
http://localhost:3000
```

중지:

```bash
pm2 delete webapp
```

### 테스트 및 타입 검사

```bash
npm test
npx tsc --noEmit
```

## 사용자 가이드

1. 메인 화면에서 학사일정, 장학금 등 빠른 질문 분야를 선택합니다.
2. 자동 입력된 질문을 수정하거나 직접 질문을 입력합니다.
3. `공식 정보 찾기` 버튼을 누릅니다.
4. React가 질문을 `POST /api/chat`으로 전송합니다.
5. Hono가 입력을 검증하고 분야·질문 목적·검색 키워드를 분석합니다.
6. 등록된 국립순천대학교 공식 게시판 또는 페이지에서 후보를 수집합니다.
7. 후보 제목, 작성부서, 게시일, 공식 URL이 화면에 표시됩니다.
8. 후보는 아직 원문 확인 전 자료이며 최종 답변으로 표시하지 않습니다.

## 공식 사이트 검색 원칙

- 국립순천대학교가 운영하는 검증된 공식 호스트만 사용합니다.
- 검색 결과 URL은 Hono 서버가 다시 검증합니다.
- 검색 결과 제목만 보지 않고 실제 공식 페이지 본문을 확인합니다.
- 공식 본문에서 근거를 찾지 못하면 답을 추측하지 않습니다.
- 서로 다른 공식 자료가 충돌하면 두 자료를 함께 표시합니다.
- 외부 웹페이지는 명령이 아닌 데이터로만 처리합니다.

초기 검토 대상은 `scnu.ac.kr`, `www.scnu.ac.kr`, `library.scnu.ac.kr`이며 실제 구현 전에 페이지별 필요성과 운영 주체를 다시 확인합니다.

## 데이터 출처

향후 답변 근거는 국립순천대학교 공식 웹사이트와 검증된 공식 하위 도메인의 공개 자료로 제한합니다. 블로그, 커뮤니티, SNS, 다른 대학 홈페이지는 학교 정보의 근거로 사용하지 않습니다.

## 보안 설계

- 사용자 입력 길이 및 형식 검증
- 서버 측 Domain Allowlist
- HTTPS 전용 요청
- 사용자 제공 URL 직접 Fetch 금지
- localhost, 내부 IP, 임의 포트 차단
- redirect 단계마다 최종 URL 재검증
- 요청 시간과 응답 크기 제한
- 외부 HTML을 React에 직접 렌더링하지 않음
- Secret과 환경변수 Git 제외
- API 요청 횟수 제한 및 캐시 확장 고려

## Cloudflare 배포

운영 배포 전 다음 작업이 필요합니다.

1. Hono API 구현
2. 실제 공식 페이지 요청 테스트
3. 보안 및 회귀 테스트
4. Cloudflare 배포 경로 선택
5. `npm run build`
6. 선택한 배포 환경으로 Worker와 정적 Assets 배포

현재 프로덕션 URL은 없습니다.

## 환경변수

현재 필요한 환경변수는 없습니다. 향후 정식 외부 검색 API를 도입할 경우 API 키는 프론트엔드가 아닌 Cloudflare Secret에만 저장합니다. 로컬 Secret 파일인 `.dev.vars`와 `.env`는 Git에 포함하지 않습니다.

## 알려진 한계

- 공식 검색 후보는 수집하지만 상세 페이지 본문은 아직 확인하지 않습니다.
- 도서관은 Angular 기반 사이트여서 현재 공식 메인 안내 페이지를 후보로 제공합니다.
- 전화번호는 조직도 메인 페이지를 후보로 제공하며 부서별 연락처 추출은 이후 단계입니다.
- 규칙 사전에 없는 표현은 지원 분야라도 분류하지 못할 수 있습니다.
- 두 분야의 점수가 비슷하면 검색하지 않고 질문을 좁혀 달라고 안내합니다.
- `/api/chat`의 `pending` 답변은 분석 결과이며 학교 정보가 아닙니다.
- 결과 미리보기 카드는 UI 구조 확인용 예시입니다.
- PDF, HWP, 이미지 첨부파일 내용은 MVP에서 자동 추출하지 않을 수 있습니다.
- 학교 사이트 HTML 구조가 변경되면 추출 규칙 수정이 필요합니다.

## 다음 개발 단계

Phase 6에서 다음을 구현합니다.

- 중앙화된 Domain Allowlist
- HTTPS, hostname, port, credential 검증
- localhost·IP 주소·내부 주소 차단
- 허용된 공식 경로 패턴 검사
- redirect 단계별 URL 재검증
- 검색 출처와 후보 URL에 동일한 검증 함수 적용
- SSRF 우회 입력 단위 테스트
- 사용자 입력 URL을 절대로 Fetch하지 않는지 회귀 테스트

## 라이선스 제안

공개 저장소에는 단순하고 널리 쓰이는 **MIT License**를 권장합니다. 단, 국립순천대학교의 명칭, 로고, 웹페이지 콘텐츠에 대한 권리는 해당 기관에 있으므로 프로젝트 코드의 라이선스와 학교 자산의 권리를 구분해야 합니다.
