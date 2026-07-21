'use client'
// app/admin/branch/rounds/page.tsx - 지점 픽업 회차 관리

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAdminInfo } from '@/lib/auth'
import type { Admin, PickupRound } from '@/types'

const ROUND_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: '임시저장', color: 'bg-gray-100 text-gray-500' },
  open:      { label: '신청중',   color: 'bg-green-100 text-green-700' },
  closed:    { label: '신청마감', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '종료',     color: 'bg-blue-100 text-blue-600' },
}

type RoundForm = {
  round_name: string
  round_number: string
  pickup_date: string
  pickup_start_time: string
  pickup_end_time: string
  apply_start_at: string
  apply_end_at: string
}

const EMPTY_FORM: RoundForm = {
  round_name: '',
  round_number: '',
  pickup_date: '',
  pickup_start_time: '10:00',
  pickup_end_time: '18:00',
  apply_start_at: '',
  apply_end_at: '',
}

function RoundFormModal({ branchId, editData, onClose, onSuccess }: {
  branchId: string
  editData?: PickupRound
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<RoundForm>(
    editData
      ? {
          round_name: editData.round_name,
          round_number: String(editData.round_number),
          pickup_date: editData.pickup_date,
          pickup_start_time: editData.pickup_start_time,
          pickup_end_time: editData.pickup_end_time,
          apply_start_at: editData.apply_start_at.slice(0, 16),
          apply_end_at: editData.apply_end_at.slice(0, 16),
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof RoundForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.round_name || !form.pickup_date || !form.apply_start_at || !form.apply_end_at) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      branch_id: branchId,
      round_name: form.round_name,
      round_number: parseInt(form.round_number) || 1,
      pickup_date: form.pickup_date,
      pickup_start_time: form.pickup_start_time,
      pickup_end_time: form.pickup_end_time,
      apply_start_at: new Date(form.apply_start_at).toISOString(),
      apply_end_at: new Date(form.apply_end_at).toISOString(),
    }

    let err
    if (editData) {
      ;({ error: err } = await supabase.from('pickup_rounds').update(payload).eq('id', editData.id))
    } else {
      ;({ error: err } = await supabase.from('pickup_rounds').insert(payload))
    }

    setSaving(false)
    if (err) { setError('저장 중 오류가 발생했습니다.'); return }
    onSuccess()
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  )

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
    />
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 my-4">
        <h3 className="font-bold text-gray-900 text-lg mb-5">
          {editData ? '픽업 회차 수정' : '픽업 회차 생성'}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="회차명 *">
                <Input value={form.round_name} onChange={set('round_name')} placeholder="예: 2025년 1월 1차 픽업" />
              </Field>
            </div>
            <Field label="회차 번호">
              <Input type="number" value={form.round_number} onChange={set('round_number')} placeholder="1" min="1" />
            </Field>
          </div>

          <Field label="픽업 날짜 *">
            <Input type="date" value={form.pickup_date} onChange={set('pickup_date')} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="픽업 시작 시간">
              <Input type="time" value={form.pickup_start_time} onChange={set('pickup_start_time')} />
            </Field>
            <Field label="픽업 종료 시간">
              <Input type="time" value={form.pickup_end_time} onChange={set('pickup_end_time')} />
            </Field>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">신청 기간</p>
            <Field label="신청 시작 *">
              <Input type="datetime-local" value={form.apply_start_at} onChange={set('apply_start_at')} />
            </Field>
            <Field label="신청 마감 *">
              <Input type="datetime-local" value={form.apply_end_at} onChange={set('apply_end_at')} />
            </Field>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">취소</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold disabled:opacity-60"
          >
            {saving ? '저장 중...' : editData ? '수정하기' : '생성하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoundsPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [rounds, setRounds] = useState<PickupRound[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editRound, setEditRound] = useState<PickupRound | undefined>()

  const fetchRounds = async (branchId: string) => {
    const { data } = await supabase
      .from('pickup_rounds')
      .select('*')
      .eq('branch_id', branchId)
      .order('pickup_date', { ascending: false })
    setRounds(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const adminInfo = await getAdminInfo(user.id)
      if (!adminInfo) { router.push('/auth/login'); return }
      setAdmin(adminInfo)
      if (adminInfo.branch_id) await fetchRounds(adminInfo.branch_id)
      setLoading(false)
    }
    init()
  }, [])

  const updateStatus = async (roundId: string, status: PickupRound['status']) => {
    await supabase.from('pickup_rounds').update({ status }).eq('id', roundId)
    setRounds(prev => prev.map(r => r.id === roundId ? { ...r, status } : r))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 text-sm">← 뒤로</button>
            <div>
              <h1 className="font-bold text-gray-900">픽업 회차 관리</h1>
              <p className="text-xs text-gray-400">{admin?.branch?.name}</p>
            </div>
          </div>
          <button
            onClick={() => { setEditRound(undefined); setShowForm(true) }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            + 회차 생성
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {rounds.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">등록된 픽업 회차가 없습니다</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-orange-500 font-medium"
            >첫 회차 만들기 →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map(round => {
              const statusCfg = ROUND_STATUS_LABEL[round.status]
              const now = new Date()
              const applyStart = new Date(round.apply_start_at)
              const applyEnd = new Date(round.apply_end_at)
              const isApplyOpen = now >= applyStart && now <= applyEnd

              return (
                <div key={round.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {isApplyOpen && (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                            신청 진행중
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">{round.round_name}</h3>
                    </div>
                    <button
                      onClick={() => { setEditRound(round); setShowForm(true) }}
                      className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg"
                    >수정</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-orange-50 rounded-xl p-3">
                      <p className="text-xs text-orange-500 mb-0.5 font-medium">픽업 날짜</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(round.pickup_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      </p>
                      <p className="text-xs text-gray-500">{round.pickup_start_time.slice(0,5)} ~ {round.pickup_end_time.slice(0,5)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-500 mb-0.5 font-medium">신청 기간</p>
                      <p className="text-xs text-gray-700">
                        {new Date(round.apply_start_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {' ~ '}
                        {new Date(round.apply_end_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        ~{new Date(round.apply_end_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 마감
                      </p>
                    </div>
                  </div>

                  {/* 상태 변경 버튼 */}
                  <div className="flex gap-2">
                    {round.status === 'draft' && (
                      <button
                        onClick={() => updateStatus(round.id, 'open')}
                        className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
                      >신청 오픈</button>
                    )}
                    {round.status === 'open' && (
                      <button
                        onClick={() => updateStatus(round.id, 'closed')}
                        className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                      >신청 마감</button>
                    )}
                    {round.status === 'closed' && (
                      <button
                        onClick={() => updateStatus(round.id, 'completed')}
                        className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                      >회차 종료</button>
                    )}
                    <button
                      onClick={() => router.push(`/admin/branch?round=${round.id}`)}
                      className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >신청 목록 보기</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showForm && admin?.branch_id && (
        <RoundFormModal
          branchId={admin.branch_id}
          editData={editRound}
          onClose={() => { setShowForm(false); setEditRound(undefined) }}
          onSuccess={async () => {
            setShowForm(false)
            setEditRound(undefined)
            if (admin.branch_id) await fetchRounds(admin.branch_id)
          }}
        />
      )}
    </div>
  )
}
