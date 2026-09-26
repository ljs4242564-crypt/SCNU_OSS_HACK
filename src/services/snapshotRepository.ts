import { VERIFIED_SNAPSHOTS, type VerifiedSnapshot } from '../data/verifiedSnapshots'
import type { QuestionAnalysis } from '../shared/api'

export interface SnapshotRepository {
  findBest(analysis: QuestionAnalysis): Promise<VerifiedSnapshot | null>
}

function includesKeyword(value: string, keyword: string) {
  return value.toLocaleLowerCase('ko-KR').includes(keyword.toLocaleLowerCase('ko-KR'))
}

export class StaticSnapshotRepository implements SnapshotRepository {
  constructor(private readonly snapshots: VerifiedSnapshot[] = VERIFIED_SNAPSHOTS) {}

  async findBest(analysis: QuestionAnalysis) {
    if (!analysis.supported || analysis.ambiguous) return null

    const matches = this.snapshots
      .filter((snapshot) => snapshot.category === analysis.category)
      .map((snapshot) => ({
        snapshot,
        score: snapshot.keywords.reduce(
          (total, keyword) => total + (analysis.matchedKeywords.some((matched) =>
            includesKeyword(matched, keyword) || includesKeyword(keyword, matched),
          ) ? 3 : 0),
          0,
        ),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)

    return matches[0]?.snapshot ?? null
  }
}

export const staticSnapshotRepository = new StaticSnapshotRepository()
