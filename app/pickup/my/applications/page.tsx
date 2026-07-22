'use client'
// app/pickup/my/applications/page.tsx
// 🔴 /pickup/my 로 통합됨 (중복 페이지 정리) - 하위 호환을 위해 리다이렉트만 유지

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function MyApplicationsRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  )
}

function RedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'

  useEffect(() => {
    router.replace(`/pickup/my?store=${store}`)
  }, [])

  return null
}
