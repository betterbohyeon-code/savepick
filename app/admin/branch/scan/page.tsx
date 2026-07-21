'use client'
// app/admin/branch/scan/page.tsx
// 🟠 픽업 현장 조회 - 모바일 반응형 + 되돌리기 기능

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { hashPhone } from '@/lib/crypto'

type AppStatus = 'confirmed' | 'picked_up' | 'no_show' | 'pending' | 'cancelled'

interface AppItem {
  id: string
  status: AppStatus
  quantity: number
  product: { name: string; sale_price: number } | null
}

interface SearchResult {
  userName: string
  userPhone: string // 복호화된 원본 (서버에서만)
  applications: AppItem[]
}

export default function ScanPage() {
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [selectedRound, setSelectedRound] = useState('current')

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`
  }

  const handleSearch = async () => {
    if (!phone || phone.length < 12) return
    setLoading(true)
    setResult(null)
    setNotFound(false)

    // 해시로 조회 (암호화된 전화번호를 직접 비교하지 않고 해시로 조회)
    const phoneHash = hashPhone(phone)

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, name')
      .eq('phone_hash', phoneHash)
      .single()

    if (!userProfile) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const { data: apps } = await supabase
      .from('pickup_applications')
      .select('id, status, quantity, product:products(name, sale_price)')
      .eq('user_id', userProfile.id)
      .not('status', 'eq', 'cancelled')
      .order('applied_at', { ascending: true })

    setLoading(false)

    if (!apps || apps.length === 0) {
      setNotFound(true)
      return
    }

    setResult({
      userName: userProfile.name,
      userPhone: phone,
      applications: apps as unknown as AppItem[],
    })
  }

  const updateStatus = async (appId: string, status: AppStatus) => {
    setProcessing(appId)
    const { error } = await supabase
      .from('pickup_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appId)

    if (!error) {
      setResult(prev => prev ? {
        ...prev,
        applications: prev.applications.map(a =>
          a.id === appId ? { ...a, status } : a
        )
      } : null)

      // 액션 로그
      const statusLabel = status === 'picked_up' ? '완료' : status === 'no_show' ? '노쇼' : '대기'
      setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${result?.userName} → ${statusLabel}`, ...prev.slice(0, 4)])
    }
    setProcessing(null)
  }

  const handlePickedUp = (id: string) => {
    if (confirm('픽업 완료 처리하시겠습니까?')) updateStatus(id, 'picked_up')
  }

  const handleNoShow = (id: string) => {
    if (confirm('노쇼 처리하시겠습니까?\n패널티가 부여됩니다.')) updateStatus(id, 'no_show')
  }

  // 🟠 되돌리기 (완료/노쇼 → 대기 상태로 복구)
  const handleRevert = (id: string, currentStatus: AppStatus) => {
    const label = currentStatus === 'picked_up' ? '완료' : '노쇼'
    if (confirm(`${label} 처리를 취소하고 대기 상태로 되돌리시겠습니까?`)) {
      updateStatus(id, 'confirmed')
    }
  }

  const statusConfig: Record<AppStatus, { label: string; color: string; bg: string }> = {
    confirmed: { label: '픽업 대기', color: '#0369a1', bg: '#e0f2fe' },
    picked_up: { label: '픽업 완료', color: '#166534', bg: '#dcfce7' },
    no_show: { label: '노쇼', color: '#991b1b', bg: '#fee2e2' },
    pending: { label: '신청중', color: '#6b7280', bg: '#f5f5f5' },
    cancelled: { label: '취소됨', color: '#6b7280', bg: '#f5f5f5' },
  }

  return (
    // 🟠 모바일 반응형 레이아웃
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">픽업 조회</h1>
            <p className="text-xs text-gray-500 mt-0.5">전화번호로 신청 내역 조회</p>
          </div>
          {/* 프린트 버튼 */}
          <button
            onClick={() => window.open('/admin/branch/print', '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 bg-white"
          >
            🖨️ 목록 출력
          </button>
        </div>

        {/* 회차 선택 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: 'current', label: '1/25 (토)' },
            { id: 'next', label: '2/1 (토)' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedRound(r.id); setResult(null); setNotFound(false) }}
              className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 transition-colors ${selectedRound === r.id ? 'bg-orange-500 text-white' : 'border border-gray-200 bg-white text-gray-500'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">전화번호 조회</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="010-0000-0000"
              maxLength={13}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || phone.length < 12}
              className="px-5 py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-40 text-sm"
            >
              {loading ? '...' : '조회'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">고객에게 전화번호를 직접 확인하세요</p>
        </div>

        {/* 결과 없음 */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center mb-4">
            <div className="text-3xl mb-2">😕</div>
            <p className="font-bold text-red-700 mb-1">신청 내역 없음</p>
            <p className="text-sm text-red-500">{phone} — 이 회차 신청 내역이 없습니다</p>
          </div>
        )}

        {/* 결과 카드 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-orange-400 overflow-hidden mb-4">
            {/* 고객 정보 */}
            <div className="bg-orange-50 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{result.userName} 님</p>
                <p className="text-sm text-gray-500 font-mono">{result.userPhone}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                result.applications.every(a => a.status === 'picked_up')
                  ? 'bg-green-100 text-green-700'
                  : result.applications.some(a => a.status === 'no_show')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {result.applications.every(a => a.status === 'picked_up') ? '완료' :
                 result.applications.some(a => a.status === 'no_show') ? '노쇼 포함' : '픽업 대기'}
              </span>
            </div>

            {/* 상품 목록 */}
            <div>
              {result.applications.map(app => {
                const st = statusConfig[app.status]
                const canProcess = app.status === 'confirmed' || app.status === 'pending'
                const canRevert = app.status === 'picked_up' || app.status === 'no_show'
                return (
                  <div key={app.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{app.product?.name}</p>
                        <p className="text-xs text-gray-400">{app.quantity}개</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {/* 처리 버튼 */}
                      {canProcess && (
                        <>
                          <button onClick={() => handlePickedUp(app.id)} disabled={!!processing}
                            className="flex-1 py-2.5 bg-green-50 text-green-700 font-bold text-sm rounded-xl disabled:opacity-40">
                            ✓ 픽업 완료
                          </button>
                          <button onClick={() => handleNoShow(app.id)} disabled={!!processing}
                            className="flex-1 py-2.5 bg-red-50 text-red-700 font-bold text-sm rounded-xl disabled:opacity-40">
                            ✗ 노쇼
                          </button>
                        </>
                      )}
                      {/* 🟠 되돌리기 버튼 */}
                      {canRevert && (
                        <button onClick={() => handleRevert(app.id, app.status)} disabled={!!processing}
                          className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl disabled:opacity-40">
                          ↩ 처리 취소
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 액션 로그 */}
        {actionLog.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-2">최근 처리 내역</p>
            {actionLog.map((log, i) => (
              <p key={i} className="text-xs text-gray-400 py-0.5">{log}</p>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
