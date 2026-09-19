import { Hono } from 'hono'
import { analyzeQuestion } from '../services/questionAnalyzer'
import { normalizeQuestion } from '../utils/textNormalizer'
import {
  CHAT_QUESTION_MAX_LENGTH,
  CHAT_QUESTION_MIN_LENGTH,
  type ApiErrorCode,
  type ApiErrorResponse,
  type ChatRequest,
  type ChatSuccessResponse,
} from '../shared/api'

const MAX_REQUEST_BYTES = 4_096

export const chatRoute = new Hono()

function createRequestMeta() {
  return {
    requestId: crypto.randomUUID(),
    processedAt: new Date().toISOString(),
  }
}

function errorResponse(code: ApiErrorCode, message: string): ApiErrorResponse {
  return {
    ok: false,
    error: { code, message },
    meta: createRequestMeta(),
  }
}

chatRoute.post('/chat', async (c) => {
  const contentType = c.req.header('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return c.json(
      errorResponse('INVALID_CONTENT_TYPE', 'Content-Type은 application/json이어야 합니다.'),
      415,
    )
  }

  const declaredLength = Number(c.req.header('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return c.json(errorResponse('PAYLOAD_TOO_LARGE', '요청 데이터가 너무 큽니다.'), 413)
  }

  let rawBody: string
  try {
    rawBody = await c.req.text()
  } catch {
    return c.json(errorResponse('INVALID_JSON', '요청 내용을 읽을 수 없습니다.'), 400)
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return c.json(errorResponse('PAYLOAD_TOO_LARGE', '요청 데이터가 너무 큽니다.'), 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return c.json(errorResponse('INVALID_JSON', '올바른 JSON 형식으로 요청해 주세요.'), 400)
  }

  if (!body || typeof body !== 'object' || typeof (body as Partial<ChatRequest>).question !== 'string') {
    return c.json(errorResponse('INVALID_QUESTION', 'question 문자열이 필요합니다.'), 400)
  }

  const question = normalizeQuestion((body as ChatRequest).question)

  if (question.length < CHAT_QUESTION_MIN_LENGTH) {
    return c.json(
      errorResponse('QUESTION_TOO_SHORT', `질문은 ${CHAT_QUESTION_MIN_LENGTH}자 이상 입력해 주세요.`),
      400,
    )
  }

  if (question.length > CHAT_QUESTION_MAX_LENGTH) {
    return c.json(
      errorResponse('QUESTION_TOO_LONG', `질문은 ${CHAT_QUESTION_MAX_LENGTH}자 이하로 입력해 주세요.`),
      400,
    )
  }

  const analysis = analyzeQuestion(question)
  const answer = analysis.supported
    ? analysis.ambiguous
      ? {
          title: '질문의 분야를 하나로 좁혀주세요',
          content: '서로 다른 분야의 키워드가 비슷한 수준으로 확인되었습니다. 한 번에 한 분야씩 질문하면 더 정확하게 검색할 수 있습니다.',
          fields: [
            { label: '우선 분류', value: analysis.categoryLabel },
            { label: '다른 후보', value: analysis.alternatives.map((item) => item.categoryLabel).join(', ') || '없음' },
            { label: '공식 검색', value: '모호한 질문으로 실행하지 않음' },
          ],
        }
      : {
          title: `${analysis.categoryLabel} 질문으로 분석했습니다`,
          content: '규칙 기반 질문 분석이 완료되었습니다. 공식 사이트 검색과 원문 확인은 다음 단계에서 연결합니다.',
          fields: [
            { label: '분야', value: analysis.categoryLabel },
            { label: '질문 목적', value: analysis.intentLabel },
            { label: '검색 키워드', value: analysis.searchKeywords.join(' · ') },
            { label: '적용 기준', value: `${analysis.context.year}학년도 ${analysis.context.semester}학기` },
          ],
        }
    : {
        title: '현재 지원 범위에서 분류하지 못했습니다',
        content: '학사일정, 장학금, 도서관, 학생지원, 부서 연락처 중 하나를 포함해 다시 질문해 주세요.',
        fields: [
          { label: '지원 분야', value: '학사일정 · 장학금 · 도서관 · 학생지원 · 부서 연락처' },
          { label: '공식 검색', value: '지원하지 않는 질문으로 실행하지 않음' },
        ],
      }

  const response: ChatSuccessResponse = {
    ok: true,
    status: 'pending',
    question,
    analysis,
    answer,
    sources: [],
    meta: createRequestMeta(),
  }

  return c.json(response, 200)
})
