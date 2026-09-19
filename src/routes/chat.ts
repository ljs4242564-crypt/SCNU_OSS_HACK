import { Hono } from 'hono'
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

function normalizeQuestion(value: string) {
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

  const response: ChatSuccessResponse = {
    ok: true,
    status: 'pending',
    question,
    answer: {
      title: '질문이 안전하게 접수되었습니다',
      content: '현재는 API 입력 검증 단계입니다. 다음 단계에서 규칙 기반 질문 분류와 공식 사이트 검색을 연결합니다.',
      fields: [
        { label: '처리 상태', value: 'API 연결 및 입력 검증 완료' },
        { label: '공식 검색', value: '아직 실행하지 않음' },
      ],
    },
    sources: [],
    meta: createRequestMeta(),
  }

  return c.json(response, 200)
})
