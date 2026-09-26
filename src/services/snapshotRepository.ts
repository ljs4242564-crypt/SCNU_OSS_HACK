import { VERIFIED_SNAPSHOTS, type VerifiedSnapshot } from '../data/verifiedSnapshots'
import type { QuestionAnalysis } from '../shared/api'

export interface SnapshotRepository {
  findBest(analysis: QuestionAnalysis): Promise<VerifiedSnapshot | null>
}

function normalizeMatchTerm(value: string) {
  return value.toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim()
}

function matchesRule(snapshot: VerifiedSnapshot, analysis: QuestionAnalysis) {
  if (!snapshot.match.intents.includes(analysis.intent)) return false

  const analysisTerms = new Set(
    [...analysis.matchedKeywords, ...analysis.searchKeywords].map(normalizeMatchTerm),
  )
  const hasTerm = (term: string) => analysisTerms.has(normalizeMatchTerm(term))

  if (snapshot.match.excluded?.some(hasTerm)) return false
  if (snapshot.match.requiredAll?.some((term) => !hasTerm(term))) return false
  if (snapshot.match.requiredAny && !snapshot.match.requiredAny.some(hasTerm)) return false

  return true
}

export class StaticSnapshotRepository implements SnapshotRepository {
  constructor(private readonly snapshots: VerifiedSnapshot[] = VERIFIED_SNAPSHOTS) {}

  async findBest(analysis: QuestionAnalysis) {
    if (!analysis.supported || analysis.ambiguous) return null

    return this.snapshots.find(
      (snapshot) => snapshot.category === analysis.category && matchesRule(snapshot, analysis),
    ) ?? null
  }
}

export const staticSnapshotRepository = new StaticSnapshotRepository()
