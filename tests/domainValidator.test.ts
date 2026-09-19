import { describe, expect, it, vi } from 'vitest'
import { safeFetchOfficial, validateOfficialUrl } from '../src/utils/domainValidator'

describe('validateOfficialUrl', () => {
  it.each([
    'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://library.scnu.ac.kr/',
    'https://www.scnu.ac.kr/haksa/sv/schdulView/selectSvList.do',
  ])('허용된 공식 URL을 통과시킨다: %s', (url) => {
    expect(validateOfficialUrl(url).valid).toBe(true)
  })

  it.each([
    'http://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://scnu.ac.kr.attacker.example/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://www.scnu.ac.kr:8443/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://user:pass@www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://127.0.0.1/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://localhost/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
    'https://www.scnu.ac.kr/admin/private',
  ])('안전하지 않은 URL을 거부한다: %s', (url) => {
    expect(validateOfficialUrl(url).valid).toBe(false)
  })
})

describe('safeFetchOfficial', () => {
  it('허용된 공식 redirect를 다시 검증해 따라간다', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { Location: '/SCNU/na/ntt/selectNttInfo.do?nttSn=2' },
      }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 })) as typeof fetch

    const result = await safeFetchOfficial(
      'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
      {},
      fetcher,
    )

    expect(result.response.status).toBe(200)
    expect(result.finalUrl.searchParams.get('nttSn')).toBe('2')
  })

  it('비공식 호스트 redirect를 차단한다', async () => {
    const fetcher = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { Location: 'https://attacker.example/private' },
    })) as typeof fetch

    await expect(safeFetchOfficial(
      'https://www.scnu.ac.kr/SCNU/na/ntt/selectNttInfo.do?nttSn=1',
      {},
      fetcher,
    )).rejects.toThrow('안전하지 않은 redirect')
  })
})
