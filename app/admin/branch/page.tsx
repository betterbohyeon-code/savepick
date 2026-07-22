'use client'
// app/admin/branch/page.tsx - 지점 관리자 대시보드

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAdminInfo } from '@/lib/auth'
import { getBranchApplications, markPickedUp, markNoShow, createProduct } from '@/lib/pickup'
import type { Admin, PickupApplication } from '@/types'

type TabType = 'applications' | 'products' | 'rounds'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: '대기',    color: 'bg-gray-100 text-gray-600' },
  confirmed:  { label: '신청완료', color: 'bg-blue-100 text-blue-700' },
  picked_up:  { label: '픽업완료', color: 'bg-green-100 text-green-700' },
  no_show:    { label: '노쇼',    color: 'bg-red-100 text-red-700' },
  cancelled:  { label: '취소',    color: 'bg-gray-100 text-gray-400' },
}

function StatCard({ label, value, sub, color }: {
  label: string
  value: number | string
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ApplicationRow({ app, onPickedUp, onNoShow }: {
  app: PickupApplication & { user?: any; product?: any; round?: any }
  onPickedUp: (id: string) => void
  onNoShow: (id: string) => void
}) {
  const status = STATUS_LABEL[app.status] || STATUS_LABEL.pending

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900 text-sm">{app.user?.name || '이름 없음'}</p>
          <p className="text-xs text-gray-400">{app.user?.phone}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700 line-clamp-1">{app.product?.name}</p>
        <p className="text-xs text-gray-400">{app.quantity}개</p>
      </td>
      <td className="px-4 py-3">
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {app.status === 'confirmed' && (
            <>
              <button
                onClick={() => onPickedUp(app.id)}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                픽업완료
              </button>
              <button
                onClick={() => onNoShow(app.id)}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                노쇼
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function ProductForm({ branchId, adminId, onClose, onSuccess }: {
  branchId: string
  adminId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    original_price: '',
    sale_price: '',
    total_quantity: '',
    description: '',
    max_per_user: '1',
    round_id: '',
  })
  const [rounds, setRounds] = useState<{ id: string; round_name: string; pickup_date: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('pickup_rounds')
      .select('id, round_name, pickup_date')
      .eq('branch_id', branchId)
      .order('pickup_date', { ascending: false })
      .then(({ data }) => setRounds(data || []))
  }, [branchId])

  const handleSubmit = async () => {
    if (!form.name || !form.original_price || !form.sale_price || !form.total_quantity) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    if (!form.round_id) {
      setError('픽업 회차를 선택해주세요. (회차가 없다면 먼저 "픽업 회차 관리"에서 만들어주세요)')
      return
    }
    setSaving(true)
    const { error } = await createProduct({
      branch_id: branchId,
      round_id: form.round_id,
      name: form.name,
      original_price: parseInt(form.original_price),
      sale_price: parseInt(form.sale_price),
      total_quantity: parseInt(form.total_quantity),
      description: form.description || undefined,
      max_per_user: parseInt(form.max_per_user),
      created_by: adminId,
    })
    setSaving(false)
    if (error) {
      setError('저장 중 오류가 발생했습니다.')
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-5">상품 등록</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">픽업 회차 *</label>
            {rounds.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">
                등록된 픽업 회차가 없어요. "픽업 회차 관리"에서 먼저 만들어주세요.
              </p>
            ) : (
              <select
                value={form.round_id}
                onChange={e => setForm(f => ({ ...f, round_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">회차를 선택하세요</option>
                {rounds.map(r => (
                  <option key={r.id} value={r.id}>{r.round_name} ({r.pickup_date})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">상품명 *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="상품명을 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">정상가 *</label>
              <input
                type="number"
                value={form.original_price}
                onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">할인가 *</label>
              <input
                type="number"
                value={form.sale_price}
                onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          {form.original_price && form.sale_price && (
            <p className="text-sm text-orange-600 font-medium">
              할인율: {Math.round((1 - parseInt(form.sale_price) / parseInt(form.original_price)) * 100)}%
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">수량 *</label>
              <input
                type="number"
                value={form.total_quantity}
                onChange={e => setForm(f => ({ ...f, total_quantity: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">1인 최대</label>
              <input
                type="number"
                value={form.max_per_user}
                onChange={e => setForm(f => ({ ...f, max_per_user: e.target.value }))}
                min="1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">설명</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="상품 설명 (선택)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">취소</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-60"
          >
            {saving ? '저장 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BranchAdminPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [applications, setApplications] = useState<PickupApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('applications')
  const [showProductForm, setShowProductForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const adminInfo = await getAdminInfo(user.id)
      if (!adminInfo || adminInfo.role !== 'branch') return
      setAdmin(adminInfo)

      if (adminInfo.branch_id) {
        const { data } = await getBranchApplications(adminInfo.branch_id)
        setApplications(data || [])
      }
      setLoading(false)
    }
    init()
  }, [])

  const handlePickedUp = async (id: string) => {
    await markPickedUp(id)
    setApplications(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'picked_up' as const } : a
    ))
  }

  const handleNoShow = async (id: string) => {
    if (!confirm('노쇼 처리하시겠습니까? 고객에게 패널티가 부여됩니다.')) return
    await markNoShow(id)
    setApplications(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'no_show' as const } : a
    ))
  }

  const filtered = applications.filter(a =>
    !searchQuery ||
    (a as any).user?.name?.includes(searchQuery) ||
    (a as any).user?.phone?.includes(searchQuery)
  )

  const stats = {
    total: applications.length,
    confirmed: applications.filter(a => a.status === 'confirmed').length,
    picked_up: applications.filter(a => a.status === 'picked_up').length,
    no_show: applications.filter(a => a.status === 'no_show').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-xl">세이브존 어드민</h1>
            <p className="text-sm text-gray-500">{admin?.branch?.name} | {admin?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!confirm('로그아웃 하시겠습니까?')) return
                await supabase.auth.signOut()
                router.push('/admin/login')
              }}
              className="text-sm text-gray-500 font-medium bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl"
            >
              로그아웃
            </button>
            <button
              onClick={() => router.push('/admin/branch/rounds')}
              className="text-sm text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl"
            >
              픽업 회차 관리
            </button>
            <button
              onClick={() => setShowProductForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              + 상품 등록
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 통계 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="전체 신청" value={stats.total} color="text-gray-900" />
          <StatCard label="신청 완료" value={stats.confirmed} sub="픽업 대기중" color="text-blue-600" />
          <StatCard label="픽업 완료" value={stats.picked_up} color="text-green-600" />
          <StatCard label="노쇼" value={stats.no_show} sub={`${stats.total > 0 ? Math.round(stats.no_show / stats.total * 100) : 0}% 노쇼율`} color="text-red-600" />
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {[
            { key: 'applications', label: '픽업 관리' },
            { key: 'products', label: '상품 목록' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 신청 목록 */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
              <h2 className="font-semibold text-gray-900">신청 목록</h2>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름, 전화번호, 픽업코드 검색"
                className="flex-1 max-w-xs border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-500">{filtered.length}건</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">고객</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">상품</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">픽업코드</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">상태</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500">처리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                        신청 내역이 없습니다
                      </td>
                    </tr>
                  ) : (
                    filtered.map(app => (
                      <ApplicationRow
                        key={app.id}
                        app={app as any}
                        onPickedUp={handlePickedUp}
                        onNoShow={handleNoShow}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 상품 등록 모달 */}
      {showProductForm && admin?.branch_id && (
        <ProductForm
          branchId={admin.branch_id}
          adminId={admin.id}
          onClose={() => setShowProductForm(false)}
          onSuccess={() => {
            setShowProductForm(false)
          }}
        />
      )}
    </div>
  )
}
