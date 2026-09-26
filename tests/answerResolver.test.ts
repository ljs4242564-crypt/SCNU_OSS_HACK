import { describe, expect, it, vi } from 'vitest'
import { analyzeQuestion } from '../src/services/questionAnalyzer'
import { resolveAnswer } from '../src/services/answerResolver'
import { StaticSnapshotRepository, type SnapshotRepository } from '../src/services/snapshotRepository'
import type { QuestionAnalysis, SearchReport } from '../src/shared/api'
import type { VerifiedDocument } from '../src/types/pipeline'

const now = new Date('2026-09-26T11:00:00.000Z')
const completedSearch: SearchReport = {
  status: 'completed',
  queriedSources: ['fixture-source'],
  failedSources: [],
  candidates: [{
    sourceId: 'fixture-source',
    sourceName: '국립순천대학교 공식 출처',
    title: '2026학년도 제2학기 중간시험',
    department: '교무학사과 학사지원팀',
    url: 'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    publishedAt: '2026-09-01',
    relevanceScore: 100,
    matchedKeywords: ['중간고사'],
  }],
}

function academicAnalysis() {
  return analyzeQuestion('이번 학기 중간고사 언제야?', now)
}

function document(startDate = '2026-10-19', title = '2026학년도 제2학기 중간시험'): VerifiedDocument {
  return {
    candidate: completedSearch.candidates[0],
    finalUrl: completedSearch.candidates[0].url,
    title,
    department: '교무학사과 학사지원팀',
    publishedAt: '2026-09-01',
    checkedAt: '2026-09-26',
    content: `${title}: ${startDate} ~ 2026-10-23`,
    evidence: [`${title}: ${startDate} ~ 2026-10-23`],
    extracted: {
      startDate,
      endDate: '2026-10-23',
      dates: [startDate, '2026-10-23'],
      phones: [],
      hours: [],
      locations: [],
    },
    relevant: true,
  }
}

const noSnapshotRepository: SnapshotRepository = {
  findBest: vi.fn(async () => null),
}

const failingSearch = vi.fn(async () => {
  throw new Error('http_error: upstream 502')
})

describe('resolveAnswer', () => {
  it('live 성공을 verified_live로 반환한다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: vi.fn(async () => completedSearch),
      documentFetcher: vi.fn(async () => [document()]),
      snapshotRepository: noSnapshotRepository,
      now: () => now,
    })

    expect(result.status).toBe('verified_live')
    expect(result.answerMode).toBe('live')
    expect(result.upstreamStatus).toBe('ok')
    expect(result.cacheHit).toBe(false)
  })

  it('502 오류에서 유효 snapshot으로 전환한다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: failingSearch,
      snapshotRepository: new StaticSnapshotRepository(),
      now: () => now,
    })

    expect(result.status).toBe('verified_snapshot')
    expect(result.answerMode).toBe('snapshot')
    expect(result.upstreamStatus).toBe('http_error')
    expect(result.cacheHit).toBe(true)
  })

  it('timeout에서 snapshot으로 전환한다', async () => {
    const searcher = vi.fn((_analysis: QuestionAnalysis, dependencies?: { signal?: AbortSignal }) =>
      new Promise<SearchReport>((_resolve, reject) => {
        dependencies?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }),
    )
    const result = await resolveAnswer(academicAnalysis(), {
      searcher,
      snapshotRepository: new StaticSnapshotRepository(),
      timeoutMs: 5,
      now: () => now,
    })

    expect(result.status).toBe('verified_snapshot')
    expect(result.upstreamStatus).toBe('timeout')
  })

  it('파싱 오류에서 snapshot으로 전환한다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: vi.fn(async () => completedSearch),
      documentFetcher: vi.fn(async () => { throw new Error('parse_error: fixture') }),
      snapshotRepository: new StaticSnapshotRepository(),
      now: () => now,
    })

    expect(result.status).toBe('verified_snapshot')
    expect(result.upstreamStatus).toBe('parse_error')
  })

  it('만료 snapshot은 stale과 경고를 반환한다', async () => {
    const analysis = analyzeQuestion('국가장학금 신청 기간 알려줘', now)
    const result = await resolveAnswer(analysis, {
      searcher: failingSearch,
      snapshotRepository: new StaticSnapshotRepository(),
      now: () => now,
    })

    expect(result.status).toBe('stale')
    expect(result.content).toContain('만료된 마지막 검증본')
  })

  it('upstream 실패와 snapshot 없음은 upstream_unavailable이다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: failingSearch,
      snapshotRepository: noSnapshotRepository,
      now: () => now,
    })

    expect(result.status).toBe('upstream_unavailable')
    expect(result.answerMode).toBe('unavailable')
  })

  it('정상 조회에 후보가 없으면 not_found를 유지한다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: vi.fn(async () => ({ ...completedSearch, candidates: [] })),
      documentFetcher: vi.fn(async () => []),
      snapshotRepository: noSnapshotRepository,
      now: () => now,
    })

    expect(result.status).toBe('not_found')
    expect(result.upstreamStatus).toBe('ok')
  })

  it('서로 다른 공식 값은 conflicting이다', async () => {
    const result = await resolveAnswer(academicAnalysis(), {
      searcher: vi.fn(async () => completedSearch),
      documentFetcher: vi.fn(async () => [document('2026-10-19'), document('2026-10-20')]),
      snapshotRepository: noSnapshotRepository,
      now: () => now,
    })

    expect(result.status).toBe('conflicting')
  })

  it.each([
    '이번 학기 중간고사 언제야?',
    '국가장학금 신청 기간 알려줘.',
    '도서관은 주말에도 운영해?',
    '학생증 재발급 방법 알려줘.',
    '학사 관련 문의 전화번호 알려줘.',
  ])('대표 질문이 장애 시 설명 가능한 snapshot을 반환한다: %s', async (question) => {
    const result = await resolveAnswer(analyzeQuestion(question, now), {
      searcher: failingSearch,
      snapshotRepository: new StaticSnapshotRepository(),
      now: () => now,
    })

    expect(['verified_snapshot', 'stale']).toContain(result.status)
    expect(result.sources[0]?.url).toMatch(/^https:\/\/(?:www\.)?(?:scnu\.ac\.kr|library\.scnu\.ac\.kr)/)
    expect(result.lastSuccessfulCheck).not.toBeNull()
  })
})
