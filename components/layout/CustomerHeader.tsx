// components/layout/CustomerHeader.tsx
// 🔴 고객용 공통 헤더 — SAVE PICK 로고 + 지점명, 오렌지 배경
// onBack이 있으면 뒤로가기 버튼, onMenu가 있으면 전화문의+햄버거 메뉴 (둘 다 있으면 둘 다 표시)

export default function CustomerHeader({
  storeName,
  onBack,
  onMenu,
  sticky = false,
}: {
  storeName: string
  onBack?: () => void
  onMenu?: () => void
  sticky?: boolean
}) {
  return (
    <div
      className={`flex-none bg-accent flex items-center justify-between gap-3 ${sticky ? 'sticky top-0 z-20' : ''}`}
      style={{ padding: onBack ? '18px 20px 16px' : '16px 20px 12px' }}
    >
      <div className="flex items-center gap-2.5">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 flex-none rounded-[9px] bg-white/[.18] flex items-center justify-center text-white text-lg font-bold"
          >
            ←
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="font-unbounded font-extrabold text-white tracking-[-0.04em] whitespace-nowrap" style={{ fontSize: 15 }}>SAVE PICK</span>
          <span className="text-[11.5px] font-semibold text-white/85 whitespace-nowrap">{storeName}</span>
        </div>
      </div>

      {onMenu && (
        <div className="flex items-center gap-1.5">
          <button className="w-[34px] h-[34px] rounded-[10px] bg-white/[.18] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
          </button>
          <button onClick={onMenu} className="w-[34px] h-[34px] flex flex-col items-center justify-center gap-1">
            <span className="w-[19px] h-0.5 bg-white rounded-full" />
            <span className="w-[19px] h-0.5 bg-white rounded-full" />
            <span className="w-[19px] h-0.5 bg-white rounded-full" />
          </button>
        </div>
      )}
    </div>
  )
}
