import type { AnswerField, QuestionCategory } from '../shared/api'

export type VerifiedSnapshot = {
  id: string
  category: QuestionCategory
  keywords: string[]
  title: string
  content: string
  fields: AnswerField[]
  sourceTitle: string
  sourceUrl: string
  department: string | null
  verifiedAt: string
  expiresAt: string
}

// Every entry below was checked against the linked official SCNU source on 2026-09-26.
// Keep only the minimum facts needed for the five demonstration questions.
export const VERIFIED_SNAPSHOTS: VerifiedSnapshot[] = [
  {
    id: 'academic-midterm-2026-2',
    category: 'academic',
    keywords: ['중간고사', '중간시험', '시험', '학기'],
    title: '2026학년도 제2학기 중간시험',
    content: '국립순천대학교 학사일정에서 제2학기 중간시험은 2026년 10월 19일부터 10월 23일까지로 확인되었습니다.',
    fields: [
      { label: '기간', value: '2026.10.19 ~ 2026.10.23' },
      { label: '담당', value: '교무학사과 학사지원팀' },
    ],
    sourceTitle: '국립순천대학교 학사일정',
    sourceUrl: 'https://www.scnu.ac.kr/haksa/sv/schdulView/schdulCalendarView.do?mi=1416',
    department: '교무학사과 학사지원팀',
    verifiedAt: '2026-09-26',
    expiresAt: '2026-10-23',
  },
  {
    id: 'scholarship-national-2026-2-second',
    category: 'scholarship',
    keywords: ['국가장학금', '장학금', '신청', '2차'],
    title: '2026학년도 2학기 국가장학금 2차 신청 안내',
    content: '2차 신청 기간은 2026년 8월 12일 09:00부터 9월 9일 18:00까지였습니다. 현재는 안내된 신청 기간이 지났으므로 새 공지를 확인해야 합니다.',
    fields: [
      { label: '신청기간', value: '2026.08.12 09:00 ~ 2026.09.09 18:00' },
      { label: '담당', value: '학생지원과' },
    ],
    sourceTitle: '2026학년도 2학기 국가장학금 2차 신청 안내',
    sourceUrl: 'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=281317355&mi=8690',
    department: '학생지원과',
    verifiedAt: '2026-09-26',
    expiresAt: '2026-09-09',
  },
  {
    id: 'library-hours-2026-09',
    category: 'library',
    keywords: ['도서관', '운영시간', '이용시간', '주말', '열람실'],
    title: '국립순천대학교 도서관 시설 이용시간',
    content: '공식 도서관 이용시간 자료에는 시설별 시간이 다르게 안내됩니다. 확인 당시 학습관 2층·4층 열람 공간은 06:00~24:00, 자료관 1~3층은 09:00~20:00(수요일 18:00까지)로 게시되어 있었습니다. 주말·방학·시험기간에는 적용 시간이 달라질 수 있어 방문 전 공식 페이지의 현재 탭을 다시 확인하세요.',
    fields: [
      { label: '학습관 2층·4층', value: '06:00 ~ 24:00' },
      { label: '자료관 1~3층', value: '09:00 ~ 20:00 · 수요일 18:00까지' },
    ],
    sourceTitle: '국립순천대학교 도서관 이용시간',
    sourceUrl: 'https://library.scnu.ac.kr/facility/avaliable-time',
    department: '국립순천대학교 도서관',
    verifiedAt: '2026-09-26',
    expiresAt: '2026-10-03',
  },
  {
    id: 'student-card-reissue-last-verified',
    category: 'student_support',
    keywords: ['학생증', '재발급', '발급'],
    title: '학생증 재발급 마지막 확인 자료',
    content: '공식 학생증 발급 안내에서 실물 학생증 재발급 수수료는 5천 원으로 확인되었습니다. 오래된 안내이므로 신청 장소와 준비물은 학생지원과에 최신 절차를 다시 확인하세요.',
    fields: [
      { label: '재발급 수수료', value: '5,000원' },
      { label: '최신 절차 확인', value: '학생지원과 문의' },
    ],
    sourceTitle: '2024학년도 학부·대학원 신입생 및 편입생 학생증 발급 안내',
    sourceUrl: 'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=281210005&mi=1131',
    department: '학생지원과',
    verifiedAt: '2024-03-08',
    expiresAt: '2024-12-31',
  },
  {
    id: 'academic-contact-2026',
    category: 'contact',
    keywords: ['학사', '교무학사과', '문의', '전화', '전화번호', '연락처'],
    title: '교무학사과 학사 문의 연락처',
    content: '2026년 국립순천대학교 공식 학사 문의 답변에서 교무학사과 연락처는 061-750-3033으로 안내되었습니다. 수업 등 세부 업무는 담당 번호가 다를 수 있습니다.',
    fields: [
      { label: '학사 문의', value: '061-750-3033' },
      { label: '담당', value: '교무학사과 학사지원팀' },
    ],
    sourceTitle: '국립순천대학교 학사 문의 공식 답변',
    sourceUrl: 'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=281316492',
    department: '교무학사과 학사지원팀',
    verifiedAt: '2026-08-06',
    expiresAt: '2026-12-31',
  },
]
