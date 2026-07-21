// app/admin/branch/print/page.tsx
// 🟠 신청자 목록 출력 (프린트/PDF용)

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { decryptPhone } from '@/lib/crypto'

interface Applicant {
  id: string
  status: string
  quantity: number
  applied_at: string
  user: { name: string; phone: string }
  product: { name: string; sale_price: number }
}

export default function PrintPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('pickup_applications')
        .select(`
          id, status, quantity, applied_at,
          user:user_profiles(name, phone),
          product:products(name, sale_price)
        `)
        .not('status', 'eq', 'cancelled')
        .order('applied_at', { ascending: true })

      if (data) {
        // 전화번호 복호화
        const decrypted = data.map((a: any) => ({
          ...a,
          user: {
            ...a.user,
            phone: decryptPhone(a.user?.phone || ''),
          },
        }))
        setApplicants(decrypted)
      }
      setLoading(false)
    }
    load()
  }, [])

  const statusLabel: Record<string, string> = {
    confirmed: '대기', picked_up: '완료', no_show: '노쇼', pending: '신청중',
  }

  const stats = {
    total: applicants.length,
    done: applicants.filter(a => a.status === 'picked_up').length,
    wait: applicants.filter(a => a.status === 'confirmed').length,
    noshow: applicants.filter(a => a.status === 'no_show').length,
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-gray-400">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      {/* 프린트 버튼 (프린트 시 숨김) */}
      <div className="print:hidden mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm"
        >
          🖨️ 프린트 / PDF 저장
        </button>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm"
        >
          닫기
        </button>
      </div>

      {/* 헤더 */}
      <div className="border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">세이브픽 · 픽업 신청자 명단</h1>
            <p className="text-gray-500 mt-1">세이브존 화정점 · {today}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">출력일시</p>
            <p className="text-sm font-mono">{new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>

        {/* 요약 통계 */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">총 신청</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
            <p className="text-xs text-gray-500">완료</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.wait}</p>
            <p className="text-xs text-gray-500">대기</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.noshow}</p>
            <p className="text-xs text-gray-500">노쇼</p>
          </div>
        </div>
      </div>

      {/* 명단 테이블 */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            <th className="text-left py-2 px-3 font-bold text-gray-700 w-8">No.</th>
            <th className="text-left py-2 px-3 font-bold text-gray-700">이름</th>
            <th className="text-left py-2 px-3 font-bold text-gray-700">전화번호</th>
            <th className="text-left py-2 px-3 font-bold text-gray-700">상품</th>
            <th className="text-center py-2 px-3 font-bold text-gray-700 w-12">수량</th>
            <th className="text-center py-2 px-3 font-bold text-gray-700 w-20">상태</th>
            <th className="text-center py-2 px-3 font-bold text-gray-700 w-20 print:hidden">서명</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((app, i) => (
            <tr key={app.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="py-2.5 px-3 text-gray-400 text-xs">{i + 1}</td>
              <td className="py-2.5 px-3 font-medium">{app.user?.name}</td>
              <td className="py-2.5 px-3 font-mono text-gray-600">{app.user?.phone}</td>
              <td className="py-2.5 px-3 text-gray-700">{app.product?.name}</td>
              <td className="py-2.5 px-3 text-center font-bold">{app.quantity}</td>
              <td className="py-2.5 px-3 text-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  app.status === 'picked_up' ? 'bg-green-100 text-green-700' :
                  app.status === 'no_show' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {statusLabel[app.status] || app.status}
                </span>
              </td>
              {/* 현장 수기 체크용 서명란 */}
              <td className="py-2.5 px-3 text-center print:hidden">
                <div className="w-16 h-7 border border-gray-300 rounded mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        본 문서는 세이브픽 서비스에서 생성된 픽업 신청자 명단입니다. 외부 유출을 금합니다.
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; }
          body { font-size: 12px; }
        }
      `}</style>
    </div>
  )
}
