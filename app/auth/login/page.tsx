'use client'
// app/auth/login/page.tsx - 카카오 로그인 페이지

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signInWithKakao } from '@/lib/auth'

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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 이미 로그인된 경우 리다이렉트
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(`/pickup?store=${store}`)
    })
  }, [])

  const handleKakaoLogin = async () => {
    setLoading(true)
    const { error } = await signInWithKakao(store)
    if (error) {
      console.error('로그인 오류:', error)
      setLoading(false)
    }
    // 성공 시 OAuth redirect 처리됨
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-6">
      {/* 로고 영역 */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
          <span className="text-white font-black text-2xl">SZ</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">세이브존 픽업</h1>
        <p className="text-gray-500 text-sm">합리적인 가격으로 원하는 상품을<br />지점에서 직접 픽업하세요</p>
      </div>

      {/* 혜택 안내 */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        {[
          { icon: '🏷️', text: '최대 70% 할인 상품' },
          { icon: '📍', text: '세이브존 9개 지점에서 픽업' },
          { icon: '⚡', text: '빠른 카카오 간편 로그인' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100">
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm text-gray-700 font-medium">{item.text}</span>
          </div>
        ))}
      </div>

      {/* 카카오 로그인 버튼 */}
      <div className="w-full max-w-xs">
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full bg-[#FEE500] hover:bg-[#F5DC00] text-[#191919] font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:opacity-70 shadow-md shadow-yellow-100"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.477 2 10.9c0 2.815 1.628 5.284 4.093 6.816L5.15 21.5a.75.75 0 001.075.826L10.7 19.6c.43.05.867.075 1.3.075 5.523 0 10-3.477 10-7.775S17.523 3 12 3z"/>
            </svg>
          )}
          <span>카카오 로그인</span>
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </div>
  )
}
