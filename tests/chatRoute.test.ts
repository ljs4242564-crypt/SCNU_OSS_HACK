import { describe, expect, it } from 'vitest'
import { chatRoute } from '../src/routes/chat'
import type { ChatResponse } from '../src/shared/api'

async function readChatResponse(response: Response) {
  return (await response.json()) as ChatResponse
}

describe('POST /chat', () => {
  it('정상 질문에 분석 결과를 반환한다', async () => {
    const response = await chatRoute.request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '도서관 몇 시까지 운영해?' }),
    })
    const body = await readChatResponse(response)

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    if (body.ok) {
      expect(body.status).toBe('pending')
      expect(body.analysis.category).toBe('library')
      expect(body.analysis.intent).toBe('hours')
      expect(body.sources).toEqual([])
    }
  })

  it('지원하지 않는 질문은 검색 키워드를 반환하지 않는다', async () => {
    const response = await chatRoute.request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '오늘 날씨 알려줘' }),
    })
    const body = await readChatResponse(response)

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    if (body.ok) {
      expect(body.analysis.supported).toBe(false)
      expect(body.analysis.searchKeywords).toEqual([])
    }
  })

  it('JSON이 아닌 요청을 거부한다', async () => {
    const response = await chatRoute.request('/chat', {
      method: 'POST',
      body: 'question=test',
    })
    const body = await readChatResponse(response)

    expect(response.status).toBe(415)
    expect(body.ok).toBe(false)
    if (!body.ok) {
      expect(body.error.code).toBe('INVALID_CONTENT_TYPE')
    }
  })

  it('160자를 초과한 질문을 거부한다', async () => {
    const response = await chatRoute.request('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '가'.repeat(161) }),
    })
    const body = await readChatResponse(response)

    expect(response.status).toBe(400)
    expect(body.ok).toBe(false)
    if (!body.ok) {
      expect(body.error.code).toBe('QUESTION_TOO_LONG')
    }
  })
})
