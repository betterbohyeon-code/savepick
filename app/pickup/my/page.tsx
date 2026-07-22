'use client'
// app/pickup/my/page.tsx - 내 신청 내역 (SAVE PICK v2 디자인)

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMyApplications, cancelApplication, isCancellable } from '@/lib/pickup'
import { getUserProfile } from '@/lib/auth'
import { getStoreName } from '@/lib/stores'
import type { PickupApplication, UserProfile } from '@/types'
import MobileShell from '@/components/layout/MobileShell'
import CustomerHeader from '@/components/layout/CustomerHeader'
import CustomerDrawer from '@/components/layout/CustomerDrawer'

type FilterKey = 'all' | 'waiting' | 'done' | 'noshow'

const STATUS_META: Record<string, { text: string; bg: string; color: string }> = {
  pending:   { text: '신청완료', bg: 'var(--accent-soft)', color: 'var(--accent)' },
  confirmed: { text: '신청완료', bg: 'var(--accent-soft)', color: 'var(--accent)' },
  picked_up: { text: '픽업완료', bg: 'var(--good-soft)', color: 'var(--good)' },
  no_show:   { text: '노쇼', bg: 'var(--danger-soft)', color: 'var(--danger)' },
  cancelled: { text: '취소됨', bg: 'var(--line)', color: 'var(--ink-soft)' },
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'waiting', label: '대기중' },
  { key: 'done', label: '완료' },
  { key: 'noshow', label: '노쇼' },
]

function matchesFilter(status: string, filter: FilterKey) {
  if (filter === 'all') return true
  if (filter === 'waiting') return status === 'confirmed' || status === 'pending'
  if (filter === 'done') return status === 'picked_up'
  if (filter === 'noshow') return status === 'no_show'
  return true
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}(${['일','월','화','수','목','금','토'][d.getDay()]})`
}

export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <MyPageInner />
    </Suspense>
  )
}

function MyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const store = searchParams.get('store') || 'hwajung'
  const storeName = getStoreName(store)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('waiting')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?store=${store}`)
        return
      }

      const prof = await getUserProfile(user.id)
      setProfile(prof)

      const { data } = await getMyApplications(user.id)
      setApplications(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleCancel = async (app: any) => {
    if (!confirm('신청을 취소하시겠습니까?')) return
    const { error } = await cancelApplication(app.id, app.round?.pickup_date)
    if (error) {
      alert(error)
      return
    }
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a))
  }

  const filtered = useMemo(() => {
    const list = applications.filter(a => matchesFilter(a.status, filter))
    if (filter === 'waiting') {
      return [...list].sort((a, b) => (a.round?.pickup_date || '').localeCompare(b.round?.pickup_date || ''))
    }
    return list
  }, [applications, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>()
    filtered.forEach(a => {
      const key = fmtDate(a.round?.pickup_date) || '날짜 미정'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(a)
    })
    return Array.from(map.entries())
  }, [filtered])

  const savingsAmount = useMemo(() => {
    const now = new Date()
    return applications
      .filter(a => a.status === 'picked_up' && a.product)
      .filter(a => {
        const d = new Date(a.applied_at)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((sum, a) => sum + ((a.product.original_price - a.product.sale_price) * (a.quantity || 1)), 0)
  }, [applications])

  const todayKey = fmtDate(new Date().toISOString())

  if (loading) {
    return (
      <MobileShell>
        <div className="min-h-screen md:h-full md:min-h-0 flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="min-h-screen md:h-full md:min-h-0 flex flex-col relative">
        <CustomerHeader storeName={storeName} onBack={() => router.push(`/pickup?store=${store}`)} onMenu={() => setDrawerOpen(true)} sticky />

        <div className="px-6 pt-4">
          <div className="bg-surface border border-line rounded-[18px] p-[18px] flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-[15px] text-ink">{profile?.name}</div>
                <div className="text-xs text-ink-soft mt-0.5">
                  {profile?.phone ? profile.phone.replace(/(\d{3})-?(\d{2,4})-?(\d{4})/, '$1-****-$3') : ''}
                </div>
              </div>
              <div className="px-3 py-1.5 bg-good-soft rounded-full text-[11px] font-bold text-good whitespace-nowrap">
                노쇼 {profile?.penalty_count || 0}회
              </div>
            </div>
            {savingsAmount > 0 && (
              <div className="flex items-baseline gap-1 px-3 py-2.5 bg-accent-soft rounded-xl">
                <span className="text-xs font-semibold text-ink">이번 달</span>
                <span className="font-unbounded font-extrabold text-accent whitespace-nowrap" style={{ fontSize: 17 }}>
                  {savingsAmount.toLocaleString()}
                </span>
                <span className="text-[13px] font-bold text-accent whitespace-nowrap">원 절약했어요</span>
              </div>
            )}
            <div className="text-[11.5px] text-ink-soft leading-relaxed border-t border-line pt-2.5">
              개인정보는 암호화되어 안전하게 보관돼요 · 노쇼 3회 누적 시 90일간 픽업 신청이 제한돼요
            </div>
          </div>
        </div>

        <div className="px-6 pt-3.5">
          <div className="flex bg-bg border border-line rounded-[10px] p-[3px] gap-0.5">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                  filter === f.key ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-6 py-3.5 pb-8 flex flex-col gap-3">
          <div className="font-bold text-[13px] text-ink">신청 내역</div>

          {grouped.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3.5 py-14 text-center">
              <div className="w-16 h-16 rounded-[18px] bg-bg border border-line flex items-center justify-center text-2xl">📋</div>
              <div className="font-bold text-sm text-ink">아직 신청한 상품이 없어요</div>
              <button
                onClick={() => router.push(`/pickup?store=${store}`)}
                className="mt-1 px-5 py-3 bg-accent rounded-xl text-[13px] font-bold text-white"
              >
                상품 보러가기
              </button>
            </div>
          ) : (
            grouped.map(([date, items]) => (
              <div key={date} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-ink">{date}</span>
                  <span className="flex-1 h-px bg-line" />
                </div>
                {items.map((app: any) => {
                  const meta = STATUS_META[app.status] || STATUS_META.pending
                  const isToday = app.status === 'confirmed' && fmtDate(app.round?.pickup_date) === todayKey
                  const canCancel = app.status === 'confirmed' && app.round?.pickup_date && isCancellable(app.round.pickup_date).ok
                  return (
                    <div
                      key={app.id}
                      className="bg-surface rounded-[14px] p-3.5 flex flex-col gap-1.5"
                      style={{ border: isToday ? '1.5px solid var(--accent)' : '1px solid var(--line)' }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-ink whitespace-nowrap">{app.product?.name || '상품명 없음'}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 bg-accent rounded-full text-[10px] font-bold text-white whitespace-nowrap">오늘 픽업</span>
                          )}
                        </div>
                        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ background: meta.bg, color: meta.color }}>
                          {meta.text}
                        </div>
                      </div>
                      <div className="text-[11.5px] text-ink-soft leading-relaxed">
                        {app.status === 'confirmed' && app.round?.pickup_start_time
                          ? `${fmtDate(app.round.pickup_date)} ${app.round.pickup_start_time.slice(0,5)}-${app.round.pickup_end_time?.slice(0,5)} 픽업 · 매장에서 전화번호로 조회하세요`
                          : app.status === 'picked_up' ? `${fmtDate(app.round?.pickup_date)} 픽업 완료`
                          : app.status === 'no_show' ? `${fmtDate(app.round?.pickup_date)} 미수령`
                          : app.status === 'cancelled' ? '신청이 취소되었어요'
                          : ''}
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(app)}
                          className="self-start mt-0.5 px-3.5 py-[7px] border border-line rounded-[9px] text-xs font-semibold text-ink-soft"
                        >
                          신청 취소
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <CustomerDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          name={profile?.name || ''}
          phone={profile?.phone || ''}
          penaltyCount={profile?.penalty_count || 0}
          storeName={storeName}
          store={store}
        />
      </div>
    </MobileShell>
  )
}
