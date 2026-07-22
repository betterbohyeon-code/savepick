'use client'
// app/pickup/edit-profile/page.tsx - 내 정보 수정 (SAVE PICK v2 디자인)

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'
import { getStoreName } from '@/lib/stores'
import MobileShell from '@/components/layout/MobileShell'
import CustomerHeader from '@/components/layout/CustomerHeader'

export default function EditProfilePage() {
  return (
    <Suspense fallback={null}>
      <EditProfilePageInner />
    </Suspense>
  )
}

function EditProfilePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?store=${store}`)
        return
      }
      const prof = await getUserProfile(user.id)
      setName(prof?.name || '')
      setPhone(prof?.phone || '')
      setLoading(false)
    }
    init()
  }, [])

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
  }

  const handleSave = async () => {
    setError('')
    if (name.trim().length < 2) { setError('이름을 2자 이상 입력해주세요'); return }
    if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) { setError('올바른 전화번호를 입력해주세요'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '저장 중 오류가 발생했습니다.')
        return
      }
      router.push(`/pickup/my?store=${store}`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm('정말 탈퇴하시겠어요? 신청 내역과 정보가 모두 삭제되며 되돌릴 수 없어요.')) return
    const res = await fetch('/api/profile/delete', { method: 'POST' })
    if (!res.ok) {
      alert('탈퇴 처리 중 오류가 발생했습니다.')
      return
    }
    await supabase.auth.signOut()
    router.push(`/auth/login?store=${store}`)
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="min-h-screen flex flex-col">
        <CustomerHeader storeName={storeName} onBack={() => router.back()} />

        <div className="px-6 pt-4">
          <h1 className="text-xl font-extrabold text-ink">내 정보 수정</h1>
          <p className="text-[13px] text-ink-soft mt-1">픽업 신청에 사용되는 정보를 수정해요</p>
        </div>

        <div className="flex-1 px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-[50px] border border-line rounded-2xl bg-surface px-4 text-sm focus:outline-none focus:border-accent"
            />
            <p className="text-[11.5px] text-ink-soft leading-tight">매장 직원이 확인하는 이름입니다</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-ink">전화번호</label>
            <div className="flex gap-2">
              <div className="h-[50px] w-[52px] flex-none border border-line rounded-2xl bg-bg flex items-center justify-center text-[13px] font-semibold text-ink-soft">+82</div>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                maxLength={13}
                className="flex-1 h-[50px] border border-line rounded-2xl bg-surface px-4 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <p className="text-[11.5px] text-ink-soft leading-tight">픽업 확인 및 연락에 사용됩니다</p>
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <div className="bg-accent-soft rounded-2xl px-4 py-3.5 text-[12.5px] leading-relaxed text-ink">
            픽업 시 이 번호로 매장에서 조회해요. 노쇼(미수령) 3회 누적 시 90일간 픽업 신청이 제한되니 예약 후 꼭 방문해주세요.
          </div>

          <div className="flex justify-end">
            <button onClick={handleWithdraw} className="text-xs text-ink-soft underline underline-offset-2">
              회원 탈퇴
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[54px] bg-accent text-white font-bold text-[15px] rounded-2xl disabled:opacity-40"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </MobileShell>
  )
}
