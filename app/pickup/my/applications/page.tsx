'use client'
// app/pickup/my/applications/page.tsx - 내 신청 내역 (탭바 2번째)

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CustomerLayout from '@/components/layout/CustomerLayout'
import { isCancellable } from '@/lib/pickup'

const STORE_NAMES: Record<string, string> = {
  hwajung: '세이브존 화정점', ulsan: '세이브존 울산점',
  nowon: '세이브존 노원점', seongnam: '세이브존 성남점',
  gwangmyung: '세이브존 광명점', daejeon: '세이브존 대전점',
  haeundae: '세이브존 해운대점', bucheon: '세이브존 부천상동점',
  jeonju: '세이브존 전주코아점',
}

interface Application {
  id: string
  status: string
  quantity: number
  applied_at: string
  product: { name: string; sale_price: number; image_url: string | null } | null
  round: { pickup_date: string; pickup_start_time: string; pickup_end_time: string } | null
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <ApplicationsPageInner />
    </Suspense>
  )
}

function ApplicationsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const storeCode = searchParams.get('store') || 'hwajung'
  const storeName = STORE_NAMES[storeCode] || '세이브존'

  const [tab, setTab] = useState<'active' | 'done'>('active')
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push(`/auth/login?store=${storeCode}`); return }

      const { data } = await supabase
        .from('pickup_applications')
        .select(`
          id, status, quantity, applied_at,
          product:products(name, sale_price, image_url),
          round:pickup_rounds(pickup_date, pickup_start_time, pickup_end_time)
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false })

      setApps((data as Application[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const activeApps = apps.filter(a => ['confirmed', 'pending'].includes(a.status))
  const doneApps = apps.filter(a => ['picked_up', 'no_show', 'cancelled'].includes(a.status))

  const handleCancel = async (app: Application) => {
    const pickupDate = app.round?.pickup_date || ''
    const { ok, reason } = isCancellable(pickupDate)
    if (!ok) { alert(reason); return }
    if (!confirm('신청을 취소하시겠습니까?')) return

    setCancelling(app.id)
    const { error } = await supabase
      .from('pickup_applications')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', app.id)

    if (!error) {
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a))
    }
    setCancelling(null)
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: '신청 완료', color: '#0369a1', bg: '#e0f2fe' },
    pending:   { label: '처리중',   color: '#6b7280', bg: '#f5f5f5' },
    picked_up: { label: '픽업 완료', color: '#166534', bg: '#dcfce7' },
    no_show:   { label: '노쇼',     color: '#991b1b', bg: '#fee2e2' },
    cancelled: { label: '취소됨',   color: '#6b7280', bg: '#f5f5f5' },
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth()+1}/${d.getDate()} (${['일','월','화','수','목','금','토'][d.getDay()]})`
  }

  const displayApps = tab === 'active' ? activeApps : doneApps

  return (
    <CustomerLayout storeName={storeName} storeCode={storeCode}>
      <div>
        {/* 취소 마감 안내 */}
        <div className="mx-4 mt-4 bg-orange-50 border-l-2 border-orange-500 rounded-r-xl px-4 py-2">
          <p className="text-xs font-bold text-orange-700">⏰ 취소 마감 안내</p>
          <p className="text-xs text-orange-600">픽업 당일 오전 9시 이후 취소 불가</p>
        </div>

        {/* 탭 */}
        <div className="flex mt-3 mx-4 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            신청중 {activeApps.length > 0 && <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{activeApps.length}</span>}
          </button>
          <button
            onClick={() => setTab('done')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'done' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            완료·취소
          </button>
        </div>

        {/* 목록 */}
        <div className="px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayApps.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-4xl mb-3">{tab === 'active' ? '📭' : '📂'}</div>
              <p className="text-gray-400 text-sm">{tab === 'active' ? '신청 내역이 없습니다' : '완료된 내역이 없습니다'}</p>
              {tab === 'active' && (
                <button
                  onClick={() => router.push(`/pickup?store=${storeCode}`)}
                  className="mt-4 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm"
                >
                  상품 둘러보기
                </button>
              )}
            </div>
          ) : displayApps.map(app => {
            const st = statusConfig[app.status]
            const canCancel = app.status === 'confirmed'
            return (
              <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* 카드 헤더 */}
                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {storeName} · {app.round ? formatDate(app.round.pickup_date) : ''}
                  </span>
                </div>
                {/* 상품 정보 */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl border border-gray-100">
                      📦
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{app.product?.name}</p>
                      <p className="text-sm text-orange-500 font-bold mt-0.5">
                        {app.product?.sale_price.toLocaleString()}원 × {app.quantity}개
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      {((app.product?.sale_price || 0) * app.quantity).toLocaleString()}원
                    </p>
                  </div>
                  {/* 픽업 일정 */}
                  {app.round && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 mb-3">
                      📅 픽업일: {formatDate(app.round.pickup_date)} &nbsp;|&nbsp; 🕙 {app.round.pickup_start_time}~{app.round.pickup_end_time}
                    </div>
                  )}
                  {/* 취소 버튼 */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(app)}
                      disabled={cancelling === app.id}
                      className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                      {cancelling === app.id ? '취소 중...' : '신청 취소'}
                    </button>
                  )}
                  {/* 픽업 방법 안내 */}
                  {app.status === 'confirmed' && (
                    <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700">
                      📞 방문 시 전화번호를 직원에게 알려주세요
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </CustomerLayout>
  )
}
