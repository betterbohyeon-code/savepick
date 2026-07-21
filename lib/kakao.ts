// lib/kakao.ts
// 카카오 알림톡 및 채널 연동 유틸리티

/**
 * 카카오 비즈니스 채널 친구추가 URL 생성
 * 각 지점별 카카오 채널 ID 기반
 */
export function getKakaoChannelAddUrl(channelId: string): string {
  // 예: @savezone-gangnam → http://pf.kakao.com/_savezone-gangnam/friend
  const cleanId = channelId.startsWith('@') ? channelId.slice(1) : channelId
  return `http://pf.kakao.com/_${cleanId}/friend`
}

/**
 * 카카오톡 공유 메시지 생성 (Web Share API 활용)
 */
export async function sharePickupInfo(params: {
  productName: string
  pickupCode: string
  pickupDate: string
  branchName: string
  pickupTime: string
}) {
  const text = `[세이브존 픽업 신청 완료]\n상품: ${params.productName}\n픽업 코드: ${params.pickupCode}\n픽업일: ${params.pickupDate} ${params.pickupTime}\n지점: ${params.branchName}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: '세이브존 픽업 신청 완료',
        text,
      })
      return true
    } catch {
      return false
    }
  }

  // 폴백: 클립보드 복사
  await navigator.clipboard.writeText(text)
  return true
}

/**
 * 픽업 완료 후 카카오 채널 친구추가 유도 컴포넌트 데이터
 */
export function getChannelAddPrompt(branchName: string, channelId: string | null) {
  if (!channelId) return null
  return {
    message: `${branchName} 카카오 채널을 친구추가하면\n다음 픽업 소식을 가장 먼저 받을 수 있어요!`,
    url: getKakaoChannelAddUrl(channelId),
  }
}

/**
 * 카카오 알림톡 발송 (서버사이드 API Route에서 호출)
 * - 실제 운영 시 카카오 비즈니스 채널 + 알림톡 API 연동 필요
 * - https://business.kakao.com/info/bizmessage/
 */
export type AlimtalkTemplate =
  | 'PICKUP_CONFIRMED'    // 픽업 신청 완료
  | 'PICKUP_REMINDER'     // 픽업일 D-1 리마인더
  | 'PICKUP_COMPLETED'    // 픽업 완료
  | 'NO_SHOW_WARNING'     // 노쇼 경고 (1~2회)
  | 'BAN_NOTICE'          // 이용 제한 안내 (3회)

export const ALIMTALK_TEMPLATES: Record<AlimtalkTemplate, string> = {
  PICKUP_CONFIRMED: `[세이브존 픽업]
#{productName} 픽업 신청이 완료되었습니다.

📦 픽업 코드: #{pickupCode}
📅 픽업일: #{pickupDate} #{pickupTime}
📍 픽업 장소: #{branchName}

픽업 시 코드를 직원에게 제시해 주세요.`,

  PICKUP_REMINDER: `[세이브존 픽업 리마인더]
내일 픽업 일정이 있습니다!

📦 상품: #{productName}
📅 픽업일: #{pickupDate} #{pickupTime}
📍 지점: #{branchName}
🔑 픽업 코드: #{pickupCode}

방문이 어려우신 경우 앱에서 미리 취소해 주세요.`,

  PICKUP_COMPLETED: `[세이브존 픽업 완료]
#{productName} 픽업이 완료되었습니다. 감사합니다!

#{branchName} 카카오 채널 친구추가 시
다음 픽업 소식을 가장 먼저 받으실 수 있습니다.`,

  NO_SHOW_WARNING: `[세이브존 픽업]
픽업 미수령(노쇼) #{penaltyCount}회 누적 안내

픽업 신청 후 방문하지 않으신 경우가 #{penaltyCount}회 기록되었습니다.
3회 누적 시 90일간 픽업 신청이 제한됩니다.

방문이 어려우신 경우 앱에서 미리 취소해 주세요.`,

  BAN_NOTICE: `[세이브존 픽업]
픽업 신청 일시 제한 안내

노쇼 3회 누적으로 #{banEndDate}까지
픽업 신청이 제한됩니다.

문의: #{branchPhone}`,
}
