'use client'
// app/auth/profile/page.tsx
// 카카오 로그인 후 최초 1회 이름·전화번호 수집 + 개인정보 동의 (SAVE PICK v2 디자인)

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStoreName } from '@/lib/stores'
import MobileShell from '@/components/layout/MobileShell'
import CustomerHeader from '@/components/layout/CustomerHeader'

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  )
}

function ProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeService, setAgreeService] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (name.trim().length < 2) e.name = '이름을 2자 이상 입력해주세요'
    if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) e.phone = '올바른 전화번호를 입력해주세요'
    if (!agreePrivacy) e.privacy = '개인정보 수집 및 이용에 동의해주세요'
    if (!agreeService) e.service = '서비스 이용약관에 동의해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      })
      const result = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?store=${store}`)
          return
        }
        if (res.status === 409) {
          setErrors({ phone: result.error })
        } else {
          alert(result.error || '저장 중 오류가 발생했습니다. 다시 시도해주세요.')
        }
        return
      }

      router.push(`/pickup?store=${store}`)
    } catch {
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const allAgreed = agreePrivacy && agreeService
  const isValid = name.trim().length >= 2 && phone.length >= 12 && allAgreed

  return (
    <MobileShell>
      <div className="min-h-screen md:h-full md:min-h-0 flex flex-col">
        <CustomerHeader storeName={storeName} onBack={() => router.back()} />

        <div className="px-6 pt-4">
          <h1 className="text-xl font-extrabold text-ink">프로필 입력</h1>
          <p className="text-[13px] text-ink-soft mt-1">픽업 신청을 위해 정보를 알려주세요</p>
        </div>

        <div className="flex-1 px-6 py-5 flex flex-col gap-4">
          {/* 픽업 지점 (읽기 전용) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">픽업 지점</label>
            <div className="h-[50px] border border-line rounded-2xl bg-bg px-4 flex items-center justify-between">
              <span className="text-sm font-bold text-ink">{storeName}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </div>
            <p className="text-[11.5px] text-ink-soft leading-tight">접속하신 지점으로 자동 설정돼요</p>
          </div>

          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="실명을 입력해주세요"
              className="h-[50px] border border-line rounded-2xl bg-surface px-4 text-sm focus:outline-none focus:border-accent"
            />
            {errors.name && <p className="text-danger text-xs">{errors.name}</p>}
            <p className="text-[11.5px] text-ink-soft leading-tight">매장 직원이 확인하는 이름입니다</p>
          </div>

          {/* 전화번호 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">전화번호</label>
            <div className="flex gap-2">
              <div className="h-[50px] w-[52px] flex-none border border-line rounded-2xl bg-bg flex items-center justify-center text-[13px] font-semibold text-ink-soft">+82</div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="10-1234-5678"
                maxLength={13}
                className="flex-1 h-[50px] border border-line rounded-2xl bg-surface px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            {errors.phone && <p className="text-danger text-xs">{errors.phone}</p>}
            <p className="text-[11.5px] text-ink-soft leading-tight">픽업 확인 및 연락에 사용됩니다</p>
          </div>

          {/* 안내 박스 */}
          <div className="bg-accent-soft rounded-2xl px-4 py-3.5 text-[12.5px] leading-relaxed text-ink">
            픽업 시 이 번호로 매장에서 조회해요. 노쇼(미수령) 3회 누적 시 90일간 픽업 신청이 제한되니 예약 후 꼭 방문해주세요.
          </div>

          {/* 약관 동의 */}
          <div className="flex flex-col gap-3 mt-1">
            <label className="flex items-center gap-2.5 py-3.5 px-1 border-b border-line cursor-pointer">
              <span
                onClick={() => { setAgreePrivacy(!allAgreed); setAgreeService(!allAgreed) }}
                className={`w-5 h-5 rounded-md flex-none flex items-center justify-center transition-colors ${allAgreed ? 'bg-ink' : 'bg-surface border border-line'}`}
              >
                {allAgreed && <span className="text-white text-[11px]">✓</span>}
              </span>
              <span className="text-[13.5px] font-bold text-ink">전체 동의합니다</span>
            </label>

            <div className="flex items-center gap-2.5 px-1">
              <span
                onClick={() => setAgreePrivacy(!agreePrivacy)}
                className={`w-[18px] h-[18px] rounded-[5px] flex-none flex items-center justify-center cursor-pointer transition-colors ${agreePrivacy ? 'bg-ink' : 'border-[1.5px] border-line'}`}
              >
                {agreePrivacy && <span className="text-white text-[10px]">✓</span>}
              </span>
              <span className="text-[13px] text-ink-soft flex-1">[필수] 개인정보 처리방침 동의</span>
              <button onClick={() => window.open('/privacy', '_blank')} className="text-xs text-ink-soft">보기</button>
            </div>

            <div className="flex items-center gap-2.5 px-1">
              <span
                onClick={() => setAgreeService(!agreeService)}
                className={`w-[18px] h-[18px] rounded-[5px] flex-none flex items-center justify-center cursor-pointer transition-colors ${agreeService ? 'bg-ink' : 'border-[1.5px] border-line'}`}
              >
                {agreeService && <span className="text-white text-[10px]">✓</span>}
              </span>
              <span className="text-[13px] text-ink-soft flex-1">[필수] 이용약관 동의</span>
              <button onClick={() => window.open('/terms', '_blank')} className="text-xs text-ink-soft">보기</button>
            </div>

            {errors.privacy && <p className="text-danger text-xs px-1">{errors.privacy}</p>}
            {errors.service && <p className="text-danger text-xs px-1">{errors.service}</p>}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="w-full h-[54px] bg-accent text-white font-bold text-[15px] rounded-2xl disabled:opacity-40 transition-opacity"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
