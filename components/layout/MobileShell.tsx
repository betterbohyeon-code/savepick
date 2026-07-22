// components/layout/MobileShell.tsx
// 🔴 고객용 화면 전용 — PC에서 접속해도 모바일 폭(430px) 그대로 중앙 고정
// 어드민 화면에는 사용하지 않음 (데스크탑 전체 폭 유지)

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center bg-[#E8E4DA]">
      <div className="w-full max-w-[640px] min-h-screen bg-bg relative md:shadow-2xl md:my-0">
        {children}
      </div>
    </div>
  )
}
