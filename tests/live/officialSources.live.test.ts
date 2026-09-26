import { describe, expect, it } from 'vitest'
import { analyzeQuestion } from '../../src/services/questionAnalyzer'
import { fetchAndVerifyCandidates } from '../../src/services/pageFetcher'
import { searchOfficialSources } from '../../src/services/searchService'

const runLive = process.env.RUN_LIVE_TESTS === '1'

describe.skipIf(!runLive)('official SCNU live sources', () => {
  it('학사일정 공식 원문에서 현재 학기 중간시험을 확인한다', async () => {
    const analysis = analyzeQuestion(
      '2026학년도 2학기 중간고사 언제야?',
      new Date('2026-09-26T00:00:00.000Z'),
    )
    const search = await searchOfficialSources(analysis)
    const documents = await fetchAndVerifyCandidates(search, analysis)

    expect(documents.some((document) =>
      document.title.includes('중간시험') && document.extracted.startDate === '2026-10-19',
    )).toBe(true)
  }, 20_000)
})
