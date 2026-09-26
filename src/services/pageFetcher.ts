import { URL_SECURITY_LIMITS } from '../config/domains'
import type { QuestionAnalysis, SearchCandidate, SearchReport } from '../shared/api'
import type { VerifiedDocument } from '../types/pipeline'
import { readResponseText, safeFetchOfficial } from '../utils/domainValidator'
import { extractOfficialDocument, extractStructuredInformation } from './contentExtractor'

const CALENDAR_API = 'https://www.scnu.ac.kr/haksa/sv/schdulView/selectSvList.do'
const CALENDAR_PAGE = 'https://www.scnu.ac.kr/haksa/sv/schdulView/schdulCalendarView.do?mi=1416'
const REQUEST_HEADERS = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'User-Agent': 'Mozilla/5.0 (compatible; SCNUCampusAssistant/1.0; +https://www.scnu.ac.kr/)',
}

type CalendarEvent = {
  bgnde?: string
  endde?: string
  schdulTitle?: string
  schdulCn?: string
}

function normalizedTopic(value: string) {
  return value.replace('중간시험', '중간고사').replace('기말시험', '기말고사').replace(/\s+/g, '')
}

function calendarMatches(event: CalendarEvent, analysis: QuestionAnalysis) {
  const title = normalizedTopic(event.schdulTitle ?? '')
  const yearMatches = event.bgnde?.startsWith(String(analysis.context.year))
  const eventMonth = Number(event.bgnde?.split('/')[1] ?? '0')
  const eventSemester = eventMonth >= 3 && eventMonth <= 8 ? 1 : 2
  const semesterMatches = title.includes(`제${analysis.context.semester}학기`)
    || title.includes(`${analysis.context.semester}학기`)
    || eventSemester === analysis.context.semester
  const specificKeywords = analysis.matchedKeywords.filter(
    (keyword) => !['학사일정', '학기', '일정', '시험'].includes(keyword),
  )
  const coreMatches = specificKeywords.some((keyword) =>
    title.includes(normalizedTopic(keyword)),
  )
  const broadScheduleQuestion = specificKeywords.length === 0
  return Boolean(yearMatches && semesterMatches && (coreMatches || broadScheduleQuestion))
}

async function fetchAcademicCalendar(
  analysis: QuestionAnalysis,
  fetcher: typeof fetch,
  checkedAt: string,
  signal?: AbortSignal,
): Promise<VerifiedDocument[]> {
  if (analysis.category !== 'academic' || analysis.intent !== 'schedule') return []

  const { response } = await safeFetchOfficial(CALENDAR_API, {
    method: 'POST',
    signal,
    headers: {
      ...REQUEST_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Referer: CALENDAR_PAGE,
    },
    body: 'sysId=SCNU',
  }, fetcher)
  if (!response.ok) throw new Error(`http_error: 학사일정 응답 오류(${response.status})`)

  let data: unknown
  try {
    const json = await readResponseText(response, URL_SECURITY_LIMITS.maxResponseCharacters)
    data = JSON.parse(json) as unknown
  } catch (error) {
    if (error instanceof Error && error.message.includes('허용된 크기')) throw error
    throw new Error('parse_error: 학사일정 JSON을 해석하지 못했습니다.')
  }
  if (!Array.isArray(data)) throw new Error('parse_error: 학사일정 응답 형식이 배열이 아닙니다.')

  return (data as CalendarEvent[])
    .filter((event) => calendarMatches(event, analysis))
    .slice(0, 3)
    .map((event, index) => {
      const title = event.schdulTitle ?? '학사일정'
      const startDate = event.bgnde?.replaceAll('/', '-') ?? null
      const endDate = event.endde?.replaceAll('/', '-') ?? startDate
      const evidence = `${title}: ${startDate ?? '날짜 미상'}${endDate && endDate !== startDate ? ` ~ ${endDate}` : ''}`
      const candidate: SearchCandidate = {
        sourceId: `academic-calendar-${index}`,
        sourceName: '국립순천대학교 학사일정',
        title,
        department: '교무학사과 학사지원팀',
        url: CALENDAR_PAGE,
        publishedAt: null,
        relevanceScore: 200 - index,
        matchedKeywords: analysis.matchedKeywords,
      }
      const extracted = extractStructuredInformation(evidence, analysis.context.year)
      extracted.startDate = startDate
      extracted.endDate = endDate
      extracted.dates = [startDate, endDate].filter((value): value is string => Boolean(value))

      return {
        candidate,
        finalUrl: CALENDAR_PAGE,
        title,
        department: candidate.department,
        publishedAt: null,
        checkedAt,
        content: event.schdulCn?.trim() || evidence,
        evidence: [evidence],
        extracted,
        relevant: Boolean(startDate),
      }
    })
}

async function fetchHtmlDocument(
  candidate: SearchCandidate,
  analysis: QuestionAnalysis,
  fetcher: typeof fetch,
  checkedAt: string,
  signal?: AbortSignal,
) {
  const { response, finalUrl } = await safeFetchOfficial(candidate.url, {
    method: 'GET',
    signal,
    headers: { ...REQUEST_HEADERS, Referer: 'https://www.scnu.ac.kr/' },
  }, fetcher)
  if (!response.ok) throw new Error(`http_error: 공식 원문 응답 오류(${response.status})`)
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('text/html')) throw new Error('parse_error: 공식 원문이 HTML이 아닙니다.')
  const html = await readResponseText(response, URL_SECURITY_LIMITS.maxResponseCharacters)
  return extractOfficialDocument(html, candidate, analysis, finalUrl.toString(), checkedAt)
}

export async function fetchAndVerifyCandidates(
  search: SearchReport,
  analysis: QuestionAnalysis,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<VerifiedDocument[]> {
  if (!analysis.supported || analysis.ambiguous) return []
  const checkedAt = new Date().toISOString().slice(0, 10)
  const documents: VerifiedDocument[] = []
  const failures: unknown[] = []
  let attemptedDocuments = 0

  if (analysis.category === 'academic' && analysis.intent === 'schedule') {
    attemptedDocuments += 1
    try {
      documents.push(...await fetchAcademicCalendar(analysis, fetcher, checkedAt, signal))
    } catch (error) {
      failures.push(error)
    }
  }

  const remainingSlots = Math.max(0, 3 - documents.length)
  if (remainingSlots > 0) {
    const candidates = search.candidates.slice(0, remainingSlots)
    attemptedDocuments += candidates.length
    const fetched = await Promise.allSettled(
      candidates.map((candidate) =>
        fetchHtmlDocument(candidate, analysis, fetcher, checkedAt, signal),
      ),
    )
    for (const result of fetched) {
      if (result.status === 'fulfilled' && result.value?.relevant) documents.push(result.value)
      if (result.status === 'rejected') failures.push(result.reason)
    }
  }

  if (documents.length === 0 && failures.length > 0) throw failures[0]
  if (documents.length === 0 && attemptedDocuments > 0) {
    throw new Error('parse_error: 공식 원문에서 질문에 맞는 근거를 추출하지 못했습니다.')
  }

  return documents.slice(0, 3)
}
