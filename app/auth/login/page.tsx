'use client'
// app/auth/login/page.tsx - 카카오 로그인 페이지 (SAVE PICK v2 디자인)

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getStoreName } from '@/lib/stores'
import MobileShell from '@/components/layout/MobileShell'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(`/pickup?store=${store}`)
    })
  }, [])

  const handleKakaoLogin = () => {
    setLoading(true)
    window.location.href = `/auth/kakao/start?store=${encodeURIComponent(store)}`
  }

  return (
    <MobileShell>
      <div className="min-h-screen flex flex-col">
        <div className="pt-[18px] px-6 flex justify-between text-[13px] font-semibold text-ink">
          <span>9:41</span>
          <span>●●●</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-7 text-center">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent-soft rounded-full text-accent text-xs font-semibold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {storeName} 접속 중
          </div>
          <div className="flex flex-col items-center" style={{ lineHeight: 0.92 }}>
            <span
              className="font-unbounded font-black tracking-[-0.04em]"
              style={{ fontSize: 26, backgroundImage: 'linear-gradient(135deg, oklch(0.76 0.16 58), oklch(0.64 0.18 40) 55%, oklch(0.56 0.19 32))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >SAVE</span>
            <span
              className="font-unbounded font-black tracking-[-0.05em]"
              style={{ fontSize: 68, backgroundImage: 'linear-gradient(135deg, oklch(0.78 0.16 60), oklch(0.64 0.18 40) 52%, oklch(0.54 0.19 32))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >PICK</span>
            <div className="flex flex-col gap-2 mt-4">
              <p className="text-[17px] font-extrabold text-ink">합리적인 가격, 좋은 발견</p>
              <p className="text-[13.5px] text-ink-soft leading-relaxed">세이브존 특가 상품을 미리 예약하고<br />매장에서 편하게 픽업하세요.</p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-3.5 mt-2">
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              className="w-full h-[52px] bg-kakao rounded-2xl flex items-center justify-center gap-2 font-bold text-[15px] text-kakao-ink disabled:opacity-70 active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-kakao-ink/30 border-t-kakao-ink rounded-full animate-spin" />
              ) : (
                <svg width="18" height="16" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.477 3 2 6.477 2 10.9c0 2.815 1.628 5.284 4.093 6.816L5.15 21.5a.75.75 0 001.075.826L10.7 19.6c.43.05.867.075 1.3.075 5.523 0 10-3.477 10-7.775S17.523 3 12 3z"/>
                </svg>
              )}
              카카오로 시작하기
            </button>
            <p className="text-xs text-ink-soft leading-relaxed">이름·전화번호는 암호화되어 안전하게 보관돼요</p>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
