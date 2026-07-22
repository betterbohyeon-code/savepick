'use client'
// app/admin/master/page.tsx
// 마스터 어드민 - 9개 지점 총괄 대시보드 (실명 표시)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Page = 'dashboard' | 'branches' | 'stats' | 'members' | 'products' | 'accounts'

export default function MasterPage() {
  const router = useRouter()
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-52 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">세이브픽</span>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">MASTER</span>
          </div>
          <p className="text-white/35 text-xs mt-1">마스터 관리자 시스템</p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <p className="text-white/25 text-xs font-bold tracking-widest px-3 py-2">현황</p>
          {([
            ['dashboard', '전체 대시보드', '▦'],
            ['branches',  '지점 현황',    '⌂'],
            ['stats',     '전체 통계',    '▦'],
            ['members',   '전체 회원',    '👤'],
          ] as [Page, string, string][]).map(([id, label, icon]) => (
            <button key={id} onClick={() => setPage(id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                page === id ? 'bg-orange-500 text-white' : 'text-white/45 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
          <p className="text-white/25 text-xs font-bold tracking-widest px-3 py-2 mt-2">관리</p>
          {([
            ['products', '공통 상품 등록', '📦'],
            ['accounts', '계정 관리',     '⚙'],
          ] as [Page, string, string][]).map(([id, label, icon]) => (
            <button key={id} onClick={() => setPage(id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                page === id ? 'bg-orange-500 text-white' : 'text-white/45 hover:bg-white/10 hover:text-white'
              }`}>
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-white/60 text-xs font-medium">마스터 관리자</p>
          <p className="text-white/30 text-xs mt-0.5">전체 지점 관리 권한</p>
        </div>
      </aside>

      {/* 메인 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              {page === 'dashboard' ? '전체 대시보드' :
               page === 'branches' ? '지점 현황' :
               page === 'stats' ? '전체 통계' :
               page === 'members' ? '전체 회원 관리' :
               page === 'products' ? '공통 상품 등록' : '계정 관리'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">9개 지점 · 2025년 1월 25일 기준</p>
          </div>
          <div className="flex items-center gap-2">
            {page === 'members' && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                👁 실명 전체 표시 (마스터 전용)
              </span>
            )}
            <button
              onClick={async () => {
                if (!confirm('로그아웃 하시겠습니까?')) return
                await supabase.auth.signOut()
                router.push('/admin/login')
              }}
              className="text-xs text-gray-500 font-medium bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg"
            >
              로그아웃
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {page === 'dashboard' && <DashboardView />}
          {page === 'branches' && <BranchesView />}
          {page === 'stats' && <StatsView />}
          {page === 'members' && <MembersView />}
          {page === 'products' && <CommonProductsView />}
          {page === 'accounts' && <AccountsView />}
        </div>
      </main>
    </div>
  )
}

// ── 대시보드 ──
function DashboardView() {
  const branches = useBranchStats()
  const total = branches.reduce((s, b) => ({
    members: s.members + b.members,
    apps: s.apps + b.apps,
    done: s.done + b.done,
    noshow: s.noshow + b.noshow,
    penalty: s.penalty + b.penalty,
  }), { members: 0, apps: 0, done: 0, noshow: 0, penalty: 0 })
  const rate = total.apps > 0 ? Math.round(total.done / total.apps * 100) : 0

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: '👥 전체 회원', val: total.members, unit: '명', sub: '9개 지점', color: '' },
          { label: '📋 오늘 신청', val: total.apps, unit: '건', sub: '전 지점 합산', color: '' },
          { label: '✅ 완료율', val: rate, unit: '%', sub: `완료 ${total.done}건`, color: 'text-green-600' },
          { label: '❌ 노쇼', val: total.noshow, unit: '건', sub: '전 지점 합산', color: 'text-red-600' },
          { label: '⚠️ 패널티', val: total.penalty, unit: '명', sub: '전 지점 합산', color: 'text-red-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color || 'text-gray-900'}`}>{c.val}<span className="text-sm text-gray-400 font-normal ml-0.5">{c.unit}</span></p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 지점 카드 */}
      <p className="text-sm font-bold text-gray-800 mb-3">지점별 오늘 현황</p>
      <div className="grid grid-cols-3 gap-3">
        {branches.map(b => {
          const r = b.apps > 0 ? Math.round(b.done / b.apps * 100) : 0
          const rc = r >= 80 ? '#16a34a' : r >= 50 ? '#f97316' : '#dc2626'
          return (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.addr}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">오늘 픽업</span>
                  {b.penalty > 0 && <span className="text-xs font-bold text-red-600">⚠ {b.penalty}명</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[['신청', b.apps, ''], ['완료', b.done, '#16a34a'], ['노쇼', b.noshow, '#dc2626']].map(([l, v, c]) => (
                  <div key={String(l)} className="text-center bg-gray-50 rounded-lg py-1.5">
                    <p className="text-sm font-bold" style={{ color: String(c) || '#1a1a1a' }}>{String(v)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{String(l)}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>완료율</span>
                  <span className="font-bold" style={{ color: rc }}>{r}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r}%`, background: rc }} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">👥 회원 {b.members}명</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 지점 현황 ──
function BranchesView() {
  const branches = useBranchStats()
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-sm">픽업 현황</p>
        </div>
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-bold">
            <th className="px-4 py-2.5 text-left">지점</th>
            <th className="px-4 py-2.5 text-left">신청</th>
            <th className="px-4 py-2.5 text-left">완료</th>
            <th className="px-4 py-2.5 text-left">노쇼</th>
            <th className="px-4 py-2.5 text-left">대기</th>
            <th className="px-4 py-2.5 text-left">완료율</th>
          </tr></thead>
          <tbody>{branches.map(b => {
            const r = b.apps > 0 ? Math.round(b.done / b.apps * 100) : 0
            const rc = r >= 80 ? '#16a34a' : r >= 50 ? '#f97316' : '#dc2626'
            return (
              <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
                <td className="px-4 py-3"><p className="font-bold">{b.name}</p><p className="text-xs text-gray-400">{b.addr}</p></td>
                <td className="px-4 py-3 font-bold">{b.apps}</td>
                <td className="px-4 py-3 font-bold text-green-600">{b.done}</td>
                <td className="px-4 py-3 font-bold text-red-600">{b.noshow}</td>
                <td className="px-4 py-3 font-bold text-orange-500">{b.wait}</td>
                <td className="px-4 py-3">
                  <p className="font-bold text-xs" style={{ color: rc }}>{r}%</p>
                  <div className="h-1 bg-gray-100 rounded mt-1 w-16 overflow-hidden"><div className="h-full rounded" style={{ width: `${r}%`, background: rc }} /></div>
                </td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-sm">회원 현황</p>
        </div>
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-bold">
            <th className="px-4 py-2.5 text-left">지점</th>
            <th className="px-4 py-2.5 text-left">회원수</th>
            <th className="px-4 py-2.5 text-left">패널티 회원</th>
            <th className="px-4 py-2.5 text-left">이용 제한</th>
            <th className="px-4 py-2.5 text-left">회원 비중</th>
          </tr></thead>
          <tbody>{branches.map(b => {
            const total = branches.reduce((s, x) => s + x.members, 0)
            const pct = Math.round(b.members / total * 100)
            return (
              <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
                <td className="px-4 py-3 font-bold">{b.name}</td>
                <td className="px-4 py-3 font-bold">{b.members}명</td>
                <td className="px-4 py-3">{b.penalty > 0 ? <span className="text-red-600 font-bold">{b.penalty}명</span> : <span className="text-gray-300">없음</span>}</td>
                <td className="px-4 py-3">{b.banned > 0 ? <span className="text-red-600 font-bold">{b.banned}명</span> : <span className="text-gray-300">없음</span>}</td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-500">{pct}%</p>
                  <div className="h-1 bg-gray-100 rounded mt-1 w-16 overflow-hidden"><div className="h-full bg-orange-400 rounded" style={{ width: `${pct}%` }} /></div>
                </td>
              </tr>
            )
          })}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── 통계 ──
function StatsView() {
  const branches = useBranchStats()
  const totA = branches.reduce((s, b) => s + b.apps, 0)
  const totD = branches.reduce((s, b) => s + b.done, 0)
  const totN = branches.reduce((s, b) => s + b.noshow, 0)
  const totM = branches.reduce((s, b) => s + b.members, 0)
  const sorted = [...branches].sort((a, b) => {
    const ra = a.apps > 0 ? a.done / a.apps : 0
    const rb = b.apps > 0 ? b.done / b.apps : 0
    return rb - ra
  })

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { l: '📋 오늘 총 신청', v: totA, u: '건', s: '9개 지점 합산', c: '' },
          { l: '✅ 전체 완료율', v: totA > 0 ? Math.round(totD / totA * 100) : 0, u: '%', s: `완료 ${totD}건`, c: 'text-green-600' },
          { l: '❌ 노쇼 건수', v: totN, u: '건', s: `노쇼율 ${totA > 0 ? Math.round(totN / totA * 100) : 0}%`, c: 'text-red-600' },
          { l: '👥 전체 회원', v: totM, u: '명', s: `평균 ${Math.round(totM / 9)}명/지점`, c: '' },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">{c.l}</p>
            <p className={`text-2xl font-bold ${c.c || 'text-gray-900'}`}>{c.v}<span className="text-sm text-gray-400 font-normal ml-0.5">{c.u}</span></p>
            <p className="text-xs text-gray-400 mt-1">{c.s}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-sm">📊 지점별 완료율 비교</p>
          <p className="text-xs text-gray-400 mt-0.5">완료율 순으로 정렬</p>
        </div>
        <div>
          {sorted.map(b => {
            const r = b.apps > 0 ? Math.round(b.done / b.apps * 100) : 0
            const rc = r >= 80 ? '#16a34a' : r >= 50 ? '#f97316' : '#dc2626'
            return (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs font-bold text-gray-700 w-20 flex-shrink-0">{b.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r}%`, background: rc }} />
                </div>
                <span className="text-xs font-bold w-10 text-right" style={{ color: rc }}>{r}%</span>
                <span className="text-xs text-gray-400 w-12 text-right">{b.apps}건</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 전체 회원 (실명 표시) ──
function MembersView() {
  const [filter, setFilter] = useState<'all' | 'penalty' | 'banned'>('all')
  const [search, setSearch] = useState('')
  const members = useMembersData()

  const filtered = members.filter(m => {
    const mq = !search || m.name.includes(search) || m.phone.includes(search) || m.branch.includes(search)
    const mf = filter === 'all' || (filter === 'penalty' && m.penalty > 0 && !m.banned) || (filter === 'banned' && m.banned)
    return mq && mf
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="이름, 전화번호, 지점 검색"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-60 focus:outline-none focus:border-orange-500" />
        <div className="flex gap-1.5">
          {(['all', 'penalty', 'banned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filter === f ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 bg-white'}`}>
              {f === 'all' ? '전체' : f === 'penalty' ? '패널티' : '이용 제한'}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-bold border-b border-gray-200">
            <th className="px-4 py-2.5 text-left">회원 (실명)</th>
            <th className="px-4 py-2.5 text-left">소속 지점</th>
            <th className="px-4 py-2.5 text-left">가입일</th>
            <th className="px-4 py-2.5 text-left">신청 횟수</th>
            <th className="px-4 py-2.5 text-left">패널티</th>
            <th className="px-4 py-2.5 text-left">관리</th>
          </tr></thead>
          <tbody>{filtered.length ? filtered.map(m => (
            <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
              <td className="px-4 py-3">
                <p className="font-bold">{m.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{m.phone}</p>
              </td>
              <td className="px-4 py-3 text-orange-500 font-medium text-xs">{m.branch}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{m.joinedAt}</td>
              <td className="px-4 py-3 font-bold">{m.appCount}</td>
              <td className="px-4 py-3">
                {m.banned ? <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">이용 제한</span>
                  : m.penalty === 0 ? <span className="text-gray-300 text-xs">없음</span>
                  : <span className={`text-xs font-bold ${m.penalty >= 3 ? 'text-red-600' : m.penalty >= 2 ? 'text-red-500' : 'text-orange-500'}`}>{m.penalty}회</span>}
              </td>
              <td className="px-4 py-3">
                <button className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50">관리</button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">조건에 맞는 회원이 없습니다</td></tr>
          )}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── 공통 상품 등록 ──
function CommonProductsView() {
  return (
    <div className="flex gap-5 h-full">
      <div className="w-72 bg-white border border-gray-200 rounded-xl p-5 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm mb-1">공통 상품 등록</h3>
        <p className="text-xs text-gray-400 mb-4">선택한 지점에 일괄 등록됩니다</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400 text-center">실제 구현에서 상품 등록 폼이 표시됩니다</p>
        </div>
        <button className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl text-sm mt-4">선택 지점에 등록하기</button>
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-sm mb-3">공통 등록 상품</p>
        <div className="text-sm text-gray-400 text-center py-10 bg-white border border-gray-200 rounded-xl">
          등록된 공통 상품이 없습니다
        </div>
      </div>
    </div>
  )
}

// ── 계정 관리 ──
function AccountsView() {
  const accounts = [
    { name: '홍마스터', email: 'master@savezone.com', role: 'master', branch: '전체', last: '2025-01-25 09:12' },
    { name: '김담당', email: 'hwajung@savezone.com', role: 'branch', branch: '화정점', last: '2025-01-25 08:45' },
    { name: '이관리', email: 'ulsan@savezone.com', role: 'branch', branch: '울산점', last: '2025-01-24 17:30' },
    { name: '박지점', email: 'nowon@savezone.com', role: 'branch', branch: '노원점', last: '2025-01-25 09:01' },
  ]
  return (
    <div>
      <div className="flex justify-between mb-3">
        <p className="text-xs text-gray-500">지점 어드민 계정을 관리합니다</p>
        <button className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg">+ 계정 추가</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-bold border-b border-gray-200">
            <th className="px-4 py-2.5 text-left">계정</th>
            <th className="px-4 py-2.5 text-left">역할</th>
            <th className="px-4 py-2.5 text-left">담당 지점</th>
            <th className="px-4 py-2.5 text-left">최근 로그인</th>
            <th className="px-4 py-2.5 text-left">관리</th>
          </tr></thead>
          <tbody>{accounts.map((a, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 text-sm">
              <td className="px-4 py-3"><p className="font-bold">{a.name}</p><p className="text-xs text-gray-400 mt-0.5">{a.email}</p></td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.role === 'master' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                  {a.role === 'master' ? '마스터' : '지점 어드민'}
                </span>
              </td>
              <td className={`px-4 py-3 text-sm ${a.role === 'master' ? 'text-gray-400' : 'text-orange-500 font-medium'}`}>{a.branch}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{a.last}</td>
              <td className="px-4 py-3"><button className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-bold text-gray-500">관리</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── Mock 데이터 훅 (실제는 Supabase RPC 사용) ──
function useBranchStats() {
  return [
    { id: 'hwajung', name: '화정점', addr: '경기 고양시', members: 47, apps: 24, done: 11, noshow: 2, wait: 11, penalty: 3, banned: 1 },
    { id: 'ulsan', name: '울산점', addr: '울산 남구', members: 38, apps: 18, done: 14, noshow: 1, wait: 3, penalty: 1, banned: 0 },
    { id: 'nowon', name: '노원점', addr: '서울 노원구', members: 62, apps: 31, done: 20, noshow: 3, wait: 8, penalty: 5, banned: 2 },
    { id: 'seongnam', name: '성남점', addr: '경기 성남시', members: 29, apps: 12, done: 9, noshow: 0, wait: 3, penalty: 0, banned: 0 },
    { id: 'gwangmyung', name: '광명점', addr: '경기 광명시', members: 33, apps: 15, done: 10, noshow: 2, wait: 3, penalty: 2, banned: 1 },
    { id: 'daejeon', name: '대전점', addr: '대전 중구', members: 41, apps: 20, done: 13, noshow: 1, wait: 6, penalty: 2, banned: 0 },
    { id: 'haeundae', name: '해운대점', addr: '부산 해운대구', members: 55, apps: 28, done: 18, noshow: 4, wait: 6, penalty: 6, banned: 2 },
    { id: 'bucheon', name: '부천상동점', addr: '경기 부천시', members: 36, apps: 16, done: 11, noshow: 1, wait: 4, penalty: 1, banned: 0 },
    { id: 'jeonju', name: '전주코아점', addr: '전북 전주시', members: 44, apps: 22, done: 15, noshow: 2, wait: 5, penalty: 3, banned: 1 },
  ]
}

function useMembersData() {
  return [
    { id: 1, name: '김민지', phone: '010-1234-5678', branch: '화정점', joinedAt: '2025-01-10', appCount: 3, penalty: 0, banned: false },
    { id: 2, name: '이철수', phone: '010-2345-6789', branch: '화정점', joinedAt: '2025-01-11', appCount: 5, penalty: 0, banned: false },
    { id: 3, name: '박영희', phone: '010-3456-7890', branch: '노원점', joinedAt: '2025-01-12', appCount: 4, penalty: 1, banned: false },
    { id: 4, name: '최지훈', phone: '010-4567-8901', branch: '울산점', joinedAt: '2025-01-13', appCount: 2, penalty: 0, banned: false },
    { id: 5, name: '정수연', phone: '010-5678-9012', branch: '해운대점', joinedAt: '2025-01-14', appCount: 6, penalty: 2, banned: false },
    { id: 6, name: '강민호', phone: '010-6789-0123', branch: '화정점', joinedAt: '2025-01-15', appCount: 4, penalty: 3, banned: true },
    { id: 7, name: '윤서아', phone: '010-7890-1234', branch: '대전점', joinedAt: '2025-01-16', appCount: 1, penalty: 0, banned: false },
    { id: 8, name: '홍길동', phone: '010-8901-2345', branch: '노원점', joinedAt: '2025-01-17', appCount: 3, penalty: 3, banned: true },
    { id: 9, name: '신지영', phone: '010-9012-3456', branch: '성남점', joinedAt: '2025-01-18', appCount: 2, penalty: 1, banned: false },
  ]
}
