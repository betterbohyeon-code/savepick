'use client'

// app/privacy/page.tsx
// 🔴 개인정보 처리방침 페이지

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-10">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">개인정보 처리방침</h1>
            <p className="text-sm text-gray-500">세이브픽 (SavePick) · 최종 수정일: 2025년 1월 25일</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-orange-800 leading-relaxed">
            세이브픽은 「개인정보 보호법」을 준수하며, 이용자의 개인정보를 안전하게 처리합니다.
          </p>
        </div>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              수집하는 개인정보 항목
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex gap-3">
                <span className="text-orange-500 font-bold flex-shrink-0">필수</span>
                <span>이름, 전화번호 (카카오 로그인 시 최초 1회 직접 입력)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400 flex-shrink-0">자동</span>
                <span>카카오 고유 식별자 (카카오 로그인 시 자동 수집)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-gray-400 flex-shrink-0">자동</span>
                <span>서비스 이용 기록 (픽업 신청 내역, 접속 일시)</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              개인정보 수집 및 이용 목적
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="list-disc">픽업 신청 접수 및 현장 신청 확인 (전화번호 조회)</li>
              <li className="list-disc">노쇼 관리 및 이용 제한 정책 운영</li>
              <li className="list-disc">픽업 이벤트 안내 및 서비스 운영</li>
              <li className="list-disc">부정 이용 방지 및 서비스 보안</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              개인정보 보유 및 이용 기간
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="font-medium">회원 정보 (이름, 전화번호)</span>
                <span className="text-orange-600 font-medium">서비스 탈퇴 시까지</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="font-medium">픽업 신청 내역</span>
                <span className="text-orange-600 font-medium">신청일로부터 1년</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-medium">접속 로그</span>
                <span className="text-orange-600 font-medium">3개월</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              개인정보 제3자 제공
            </h2>
            <p>
              세이브픽은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우는 예외입니다.
            </p>
            <ul className="space-y-1 pl-4 mt-2">
              <li className="list-disc">이용자가 사전에 동의한 경우</li>
              <li className="list-disc">법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              개인정보 처리 위탁
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2 font-bold text-gray-600 pb-1 border-b border-gray-200">
                <span>수탁 업체</span>
                <span>위탁 업무</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Supabase Inc.</span>
                <span>데이터베이스 운영 및 인증</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>Vercel Inc.</span>
                <span>서버 호스팅</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span>카카오(주)</span>
                <span>소셜 로그인 인증</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
              개인정보 보호 조치
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="list-disc">전화번호는 AES-256-GCM 암호화 후 저장</li>
              <li className="list-disc">관리자 계정 이중 인증(2FA) 적용</li>
              <li className="list-disc">개인정보 접근 권한 최소화 (지점 어드민은 자기 지점만 조회)</li>
              <li className="list-disc">접근 로그 기록 및 정기적 보안 점검</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">7</span>
              이용자의 권리
            </h2>
            <p className="mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="space-y-2 pl-4">
              <li className="list-disc">개인정보 열람 요청</li>
              <li className="list-disc">개인정보 정정·삭제 요청</li>
              <li className="list-disc">개인정보 처리 정지 요청</li>
              <li className="list-disc">서비스 탈퇴 및 개인정보 삭제</li>
            </ul>
            <p className="mt-2 text-gray-500">
              권리 행사는 앱 내 설정 또는 아래 개인정보 보호책임자에게 연락하시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">8</span>
              개인정보 보호책임자
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium mb-1">세이브픽 운영팀</p>
              <p className="text-gray-500">이메일: privacy@savepick.co.kr</p>
              <p className="text-gray-500 text-xs mt-2">
                개인정보 침해에 대한 신고나 상담이 필요하신 경우<br />
                개인정보보호위원회 (privacy.go.kr / 국번없이 182)에 문의하실 수 있습니다.
              </p>
            </div>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">본 방침은 2025년 1월 25일부터 시행됩니다.</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-6 py-2 bg-orange-500 text-white font-bold rounded-xl text-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
