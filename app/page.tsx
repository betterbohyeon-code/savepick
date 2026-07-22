'use client'
// app/page.tsx - 스플래시(최초 진입) 화면
// QR코드/링크로 처음 들어왔을 때 잠깐 보여주고, 로그인 상태에 맞는 화면으로 자동 이동

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getStoreName } from '@/lib/stores'
import MobileShell from '@/components/layout/MobileShell'

export default function SplashPage() {
  return (
    <Suspense fallback={null}>
      <SplashPageInner />
    </Suspense>
  )
}

function SplashPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)

  useEffect(() => {
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/auth/login?store=${store}`)
        return
      }
      router.replace(`/pickup?store=${store}`)
    }, 1600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <MobileShell>
      <div
        className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(160deg, oklch(0.68 0.17 48), var(--accent) 55%, oklch(0.56 0.19 30))' }}
      >
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/[.12] animate-[float1_6s_ease-in-out_infinite]" />
        <div className="absolute -bottom-12 -left-12 w-52 h-52 rounded-full bg-white/[.09] animate-[float2_7s_ease-in-out_infinite]" />

        <div className="relative flex flex-col items-center gap-4 px-10 text-center">
          <div className="flex flex-col items-center animate-[splashLogo_1.1s_cubic-bezier(0.2,0.7,0.3,1)_both]" style={{ lineHeight: 0.9 }}>
            <span className="font-unbounded font-black text-white tracking-[-0.04em]" style={{ fontSize: 30 }}>SAVE</span>
            <span className="font-unbounded font-black text-white tracking-[-0.05em]" style={{ fontSize: 76 }}>PICK</span>
          </div>
          <p className="font-semibold text-white text-sm animate-[splashTag_1.4s_ease_both]">합리적인 가격, 좋은 발견</p>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-14 w-[120px] h-1 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full rounded-full bg-white animate-[splashBar_1.1s_ease-in-out_infinite]" style={{ width: '60%' }} />
        </div>
        <div className="absolute left-0 right-0 bottom-6 text-center text-[11px] font-semibold text-white/75">
          {storeName}
        </div>
      </div>

      <style>{`
        @keyframes float1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(18px); } }
        @keyframes float2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        @keyframes splashLogo { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes splashTag { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashBar { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(200%); } }
      `}</style>
    </MobileShell>
  )
}
