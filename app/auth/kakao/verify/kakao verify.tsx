'use client'
// app/auth/kakao/verify/page.tsx
// 🔴 서버가 발급한 매직링크 토큰을 브라우저에서 검증 -> 세션(쿠키) 확정 -> 다음 페이지로 이동

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function KakaoVerifyPage() {
  return (
    <Suspense fallback={null}>
      <KakaoVerifyInner />
    </Suspense>
  )
}

function KakaoVerifyInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const tokenHash = searchParams.get('token_hash')
      const store = searchParams.get('store') || 'hwajung'

      if (!tokenHash) {
        router.replace(`/auth/login?store=${store}&error=missing_token`)
        return
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
      })

      if (verifyError) {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        setTimeout(() => router.replace(`/auth/login?store=${store}`), 1500)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace(`/auth/login?store=${store}`)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_profile_complete')
        .eq('id', user.id)
        .single()

      if (!profile?.is_profile_complete) {
        router.replace(`/auth/profile?store=${store}`)
        return
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', user.id)
        .single()

      if (admin?.role === 'master') {
        router.replace('/admin/master')
        return
      }
      if (admin?.role === 'branch') {
        router.replace('/admin/branch')
        return
      }

      router.replace(`/pickup?store=${store}`)
    }

    run()
  }, [])

  return (
    <div className="min-h-screen md:h-full md:min-h-0 flex flex-col items-center justify-center gap-3 bg-white">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{error || '로그인 처리 중...'}</p>
    </div>
  )
}
