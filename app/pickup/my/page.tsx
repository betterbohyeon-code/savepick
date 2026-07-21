'use client'
// app/pickup/my/page.tsx - 내 픽업 신청 내역

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMyApplications, cancelApplication } from '@/lib/pickup'
import type { PickupApplication } from '@/types'

const STATUS_CONFIG = {
  confirmed:  { label: '신청완료',  icon: '✅', bg: 'bg-blue-50',  text: 'text-blue-700',  desc: '픽업 날짜에 방문해주세요' },
  picked_up:  { label: '픽업완료',  icon: '🎉', bg: 'bg-green-50', text: 'text-green-700', desc: '픽업이 완료되었습니다' },
  no_show:    { label: '노쇼',      icon: '❌', bg: 'bg-red-50',   text: 'text-red-600',   desc: '노쇼 패널티가 부여됩니다' },
  cancelled:  { label: '취소됨',    icon: '🚫', bg: 'bg-gray-50',  text: 'text-gray-500',  desc: '신청이 취소되었습니다' },
  pending:    { label: '처리중',    icon: '⏳', bg: 'bg-yellow-50',text: 'text-yellow-700',desc: '처리 중입니다' },
}

function ApplicationCard({ app, onCancel }: {
  app: PickupApplication & { product?: any; branch?: any; round?: any }
  onCancel: (id: string) => void
}) {
  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending

  return (
    <div className={`rounded-2xl border overflow-hidden ${app.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className={`${config.bg} px-4 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
        </div>
        <code className="text-xs bg-white/70 px-2 py-0.5 rounded font-mono text-gray-700">
          {app.pickup_code}
        </code>
      </div>
      <div className="bg-white p-4">
        <div className="flex gap-3">
          {app.product?.image_url && (
            <img src={app.product.image_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {app.product?.name || '상품명 없음'}
            </p>
            <p className="text-orange-600 font-bold text-sm mt-0.5">
              {app.product?.sale_price?.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">{app.branch?.name}</p>
          </div>
        </div>

        {app.round?.pickup_date && (
          <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-base">📅</span>
            <div>
              <p className="text-xs font-medium text-gray-700">
                {new Date(app.round.pickup_date).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
                })}
              </p>
              <p className="text-xs text-gray-500">
                {app.round.pickup_start_time?.slice(0, 5)} ~ {app.round.pickup_end_time?.slice(0, 5)}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">{config.desc}</p>

        {app.status === 'confirmed' && (
          <button
            onClick={() => onCancel(app.id)}
            className="mt-3 w-full py-2.5 border border-red-200 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
          >
            신청 취소
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<PickupApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('active')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await getMyApplications(user.id)
      setApplications(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleCancel = async (id: string) => {
    if (!confirm('신청을 취소하시겠습니까?')) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await cancelApplication(id, user.id)
    if (!error) {
      setApplications(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'cancelled' as const } : a
      ))
    }
  }

  const filtered = applications.filter(a => {
    if (filter === 'active') return ['confirmed', 'pending'].includes(a.status)
    if (filter === 'done') return ['picked_up', 'no_show', 'cancelled'].includes(a.status)
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← 뒤로
          </button>
          <h1 className="font-bold text-gray-900">내 픽업 내역</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 필터 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: 'active', label: '예정' },
            { key: 'done', label: '완료/취소' },
            { key: 'all', label: '전체' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">신청 내역이 없습니다</p>
            <button
              onClick={() => router.push('/pickup')}
              className="mt-4 text-sm text-orange-500 font-medium"
            >
              픽업 상품 보러가기 →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(app => (
              <ApplicationCard key={app.id} app={app as any} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
