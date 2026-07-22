// components/layout/MobileShell.tsx
// 🔴 고객용 화면 전용 — PC에서 접속해도 모바일 비율 그대로 640px로 확대(zoom) 표시
// 어드민 화면에는 사용하지 않음 (데스크탑 전체 폭 유지)
//
// ⚠️ 모바일(md 미만)에서는 min-h-screen 기반의 원래 방식이 그대로 유지된다
//    (자연스러운 페이지 스크롤, 키보드 뜰 때 입력창 자동 스크롤 등 정상 동작).
//    PC(md 이상)에서만 zoom:1.3333으로 확대 + 별도 높이 보정을 적용한다.
//    zoom이 걸리면 안의 vh 값이 실제 화면 기준으로 133%까지 부풀어 보이므로,
//    PC에서만 기준 높이를 75vh(=100/1.3333)로 낮춰 확대 후 정확히 100vh가 되게 한다.

export default function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex justify-center bg-[#E8E4DA]">
      <div className="w-full max-w-[480px] min-h-screen md:h-[75vh] md:my-[12.5vh] md:overflow-y-auto md:[zoom:1.3333] bg-bg relative md:shadow-2xl">
        {children}
      </div>
    </div>
  )
}
