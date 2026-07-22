'use client'
// app/admin/login/page.tsx
// 🔴 어드민 로그인 (카카오 아님 — 이메일/비밀번호)

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  )
}

function AdminLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('어드민 계정이 아닙니다. 관리자에게 문의해주세요.')
    }

    // 이미 로그인된 경우 역할에 맞게 이동
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (admin?.role === 'master') router.push('/admin/master')
      else if (admin?.role === 'branch') router.push('/admin/branch')
    })
  }, [])

  const handleLogin = async () => {
    setError('')
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.user) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single()

    if (!admin || admin.is_active === false) {
      setError('어드민 계정이 아니거나 비활성화된 계정입니다.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push(admin.role === 'master' ? '/admin/master' : '/admin/branch')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-lg">SP</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900">세이브픽 어드민</h1>
          <p className="text-sm text-gray-400 mt-1">지점 관리자 전용</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="이메일"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900 bg-white"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호"
            className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900 bg-white"
            autoComplete="current-password"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
      </div>
    </div>
  )
}
