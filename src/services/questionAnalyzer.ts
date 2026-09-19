import {
  CATEGORY_RULES,
  INTENT_LABELS,
  INTENT_RULES,
  type CategoryRule,
  type SupportedCategory,
} from '../config/keywords'
import type { QuestionAnalysis, QuestionCategory, QuestionIntent } from '../shared/api'
import { normalizeQuestion } from '../utils/textNormalizer'

const MIN_SUPPORTED_SCORE = 4
const AMBIGUITY_SCORE_DIFFERENCE = 2

const INTENT_SEARCH_TERMS: Partial<Record<QuestionIntent, string>> = {
  schedule: '일정',
  application: '신청',
  hours: '운영시간',
  contact: '연락처',
  procedure: '신청 방법',
  location: '위치',
}

type CategoryScore = {
  rule: CategoryRule
  score: number
  strongMatches: string[]
  relatedMatches: string[]
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function includesKeyword(question: string, keyword: string) {
  return question.toLocaleLowerCase('ko-KR').includes(keyword.toLocaleLowerCase('ko-KR'))
}

function findDistinctMatches(question: string, keywords: string[]) {
  const matches = keywords
    .filter((keyword) => includesKeyword(question, keyword))
    .sort((left, right) => right.length - left.length)

  return matches.filter(
    (keyword, index) => !matches.slice(0, index).some((longerKeyword) => longerKeyword.includes(keyword)),
  )
}

function scoreCategory(question: string, rule: CategoryRule): CategoryScore {
  const strongMatches = findDistinctMatches(question, rule.strongKeywords)
  const relatedMatches = findDistinctMatches(question, rule.relatedKeywords)

  return {
    rule,
    score: strongMatches.length * 5 + relatedMatches.length * 2,
    strongMatches,
    relatedMatches,
  }
}

function rankCategories(question: string) {
  const scores = CATEGORY_RULES.map((rule) => scoreCategory(question, rule))
  const hasSpecificCategory = scores.some(
    ({ rule, strongMatches }) => rule.id !== 'contact' && strongMatches.length > 0,
  )

  if (hasSpecificCategory) {
    const contact = scores.find(({ rule }) => rule.id === 'contact')
    if (contact) {
      contact.score = Math.min(contact.score, 3)
    }
  }

  return scores.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    return CATEGORY_RULES.findIndex((rule) => rule.id === left.rule.id)
      - CATEGORY_RULES.findIndex((rule) => rule.id === right.rule.id)
  })
}

function detectIntent(question: string, category: QuestionCategory): QuestionIntent {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((pattern) => includesKeyword(question, pattern))) {
      return rule.id
    }
  }

  return category === 'contact' ? 'contact' : 'general'
}

function inferAcademicContext(question: string, now: Date) {
  const explicitYear = question.match(/\b(20\d{2})(?:\s*학년도|\s*년)?\b/)
  const explicitSemester = question.match(/(?:제\s*)?([12])\s*학기/)
  const koreanSemester = question.includes('첫 학기') || question.includes('1학기')
    ? 1
    : question.includes('두 번째 학기') || question.includes('2학기')
      ? 2
      : null

  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const currentSemester: 1 | 2 = currentMonth >= 3 && currentMonth <= 8 ? 1 : 2

  let year = explicitYear ? Number(explicitYear[1]) : currentYear
  let semester = (explicitSemester ? Number(explicitSemester[1]) : koreanSemester) as 1 | 2 | null
  let semesterWasExplicit = Boolean(explicitSemester || koreanSemester)

  if (!semester && question.includes('다음 학기')) {
    semesterWasExplicit = true
    if (currentSemester === 1) {
      semester = 2
    } else {
      semester = 1
      year += 1
    }
  }

  if (!semester && (question.includes('지난 학기') || question.includes('이전 학기'))) {
    semesterWasExplicit = true
    if (currentSemester === 2) {
      semester = 1
    } else {
      semester = 2
      year -= 1
    }
  }

  return {
    year,
    semester: semester ?? currentSemester,
    yearWasExplicit: Boolean(explicitYear),
    semesterWasExplicit,
  } as const
}

function buildSearchKeywords(
  category: CategoryRule,
  intent: QuestionIntent,
  matches: string[],
  context: QuestionAnalysis['context'],
) {
  const intentTerm = INTENT_SEARCH_TERMS[intent]

  return unique([
    ...matches,
    ...category.searchTerms,
    intentTerm ?? '',
    `${context.year}학년도`,
    `${context.semester}학기`,
  ]).slice(0, 7)
}

export function analyzeQuestion(rawQuestion: string, now = new Date()): QuestionAnalysis {
  const question = normalizeQuestion(rawQuestion)
  const ranked = rankCategories(question)
  const top = ranked[0]
  const second = ranked[1]
  const supported = Boolean(top && top.score >= MIN_SUPPORTED_SCORE)
  const category: QuestionCategory = supported ? top.rule.id : 'unknown'
  const categoryLabel = supported ? top.rule.label : '지원하지 않는 질문'
  const intent = detectIntent(question, category)
  const context = inferAcademicContext(question, now)
  const ambiguous = Boolean(
    supported
      && second
      && second.score >= MIN_SUPPORTED_SCORE
      && top.score - second.score <= AMBIGUITY_SCORE_DIFFERENCE,
  )
  const matchedKeywords = supported
    ? unique([...top.strongMatches, ...top.relatedMatches])
    : []
  const searchKeywords = supported
    ? buildSearchKeywords(top.rule, intent, matchedKeywords, context)
    : []

  let confidence: QuestionAnalysis['confidence'] = 'low'
  const hasSpecificIntent = intent !== 'general'
  if (supported && !ambiguous && (top.score >= 7 || (top.strongMatches.length > 0 && hasSpecificIntent))) {
    confidence = 'high'
  } else if (supported && !ambiguous) {
    confidence = 'medium'
  }

  return {
    category,
    categoryLabel,
    intent,
    intentLabel: INTENT_LABELS[intent],
    confidence,
    supported,
    ambiguous,
    matchedKeywords,
    searchKeywords,
    alternatives: ranked
      .filter(({ rule, score }) => rule.id !== category && score > 0)
      .slice(0, 2)
      .map(({ rule, score }) => ({
        category: rule.id as SupportedCategory,
        categoryLabel: rule.label,
        score,
      })),
    context,
  }
}
