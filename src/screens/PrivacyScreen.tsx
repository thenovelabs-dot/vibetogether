import { features } from "../config/features";

export default function PrivacyScreen() {
  const isAppsInToss = features.tossLogin;
  const isMeetupEnabled = features.meetups;
  const isCoffeechatEnabled = features.coffeechat;

  return (
    <div className="px-4 py-8 max-w-[720px] mx-auto">
      <h1 className="text-[22px] font-bold text-[#101828] tracking-[-0.32px] mb-1">개인정보 처리방침</h1>
      <p className="text-[13px] text-[#99a1af] mb-8">시행일: 2026년 6월 14일</p>

      <section className="flex flex-col gap-6 text-[14px] leading-relaxed text-[#364153]">
        <div>
          <h2 className="font-bold text-[#101828] mb-2">1. 개인정보 처리자</h2>
          <ul className="flex flex-col gap-1">
            <li>운영자: nove</li>
            <li>서비스명: 같이바코할사람</li>
            <li>문의: <a href="mailto:thenovelabs@gmail.com" className="underline hover:text-[#ae49fd] transition-colors">thenovelabs@gmail.com</a></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-3">2. 수집하는 개인정보 항목</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f9fafb]">
                  {["구분", "수집 항목", "수집 방법"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 border border-[#e5e7eb] font-medium text-[#101828] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">필수</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">{isAppsInToss ? "토스 로그인 식별자, 닉네임, 지역" : "이메일 주소, Google 계정 식별자, 닉네임, 지역"}</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">{isAppsInToss ? "토스 로그인 및 이용자 입력" : "Google 로그인 및 이용자 입력"}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">선택</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">프로필 사진, 직업군, 사용하는 AI 도구</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">이용자 직접 입력</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">자동 생성</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">IP 주소, 접속 로그, 기기·브라우저 정보</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">서비스 이용 과정에서 자동 수집</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[13px] text-[#6b7280]">선택 항목을 입력하지 않아도 서비스 가입 및 이용에는 제한이 없으며, 해당 항목을 활용하는 일부 추천·필터 기능만 제한될 수 있습니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">3. 수집 목적</h2>
          <ul className="flex flex-col gap-1 pl-4">
            {[
              "회원 식별 및 서비스 제공",
              ...(isMeetupEnabled || isCoffeechatEnabled ? ["동네 기반 모임 매칭 및 커피챗 연결"] : []),
              ...(isMeetupEnabled ? ["이메일 알림 발송 (모임 수락 통보 등)"] : []),
              "서비스 운영 및 부정 이용 방지",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#ae49fd] shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">4. 보유 및 이용 기간</h2>
          <p>회원정보는 회원 탈퇴 시 지체 없이 파기합니다. 다만 부정 이용 방지 및 분쟁 대응을 위해 접속 로그, 이용 제한 이력 등 최소한의 정보는 탈퇴일로부터 최대 1년간 분리 보관 후 파기할 수 있습니다. 관계 법령에 따라 보존이 필요한 정보가 있는 경우 해당 법령에서 정한 기간 동안 보관합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">5. 개인정보의 파기 절차 및 방법</h2>
          <p>개인정보는 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 파기합니다. 전자적 파일 형태로 저장된 개인정보는 복구 및 재생이 불가능한 방법으로 영구 삭제합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">6. 개인정보의 제3자 제공</h2>
          {!isCoffeechatEnabled ? (
            <p>운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 법령에 따른 요청 등 예외적인 경우에는 관련 법령에 따라 처리합니다.</p>
          ) : (
            <>
          <p className="mb-3">커피챗 수락 시, 수락한 이용자의 이메일 주소가 상대방 이용자에게 공개됩니다.</p>
          <ul className="flex flex-col gap-1 pl-4 mb-3">
            {[
              ["제공받는 자", "커피챗을 요청한 상대방 이용자"],
              ["제공 항목", "이메일 주소"],
              ["제공 목적", "커피챗 일정 조율 및 직접 연락"],
              ["제공받는 자의 보유·이용 기간", "커피챗 일정 조율 및 직접 연락 목적 달성 시까지"],
              ["동의 방식", "커피챗 수락 시점의 명시적 동의"],
            ].map(([label, value]) => (
              <li key={label} className="flex gap-2">
                <span className="text-[#ae49fd] shrink-0">·</span>
                <span><span className="font-medium">{label}</span>: {value}</span>
              </li>
            ))}
          </ul>
          <p>제공받은 이용자는 위 목적 달성 후 해당 정보를 지체 없이 삭제해야 하며, 목적 외 이용·제공·공개가 금지됩니다. 다만 운영자는 이용자 간 직접 연락 과정에서 상대방이 별도로 저장·이용하는 행위를 기술적으로 통제하기 어려울 수 있습니다.</p>
            </>
          )}
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-3">7. 개인정보 처리의 위탁 및 국외 이전</h2>
          <p className="mb-3">운영자는 서비스 제공을 위해 아래 업체에 개인정보 처리를 위탁하고 있습니다. 이 중 일부 업체는 국외에 소재하여 개인정보가 국외로 이전됩니다.</p>

          <h3 className="font-medium text-[#101828] mb-2">7-1. 처리 위탁 (국내 저장)</h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f9fafb]">
                  {["수탁업체", "위탁 목적", "위탁 항목", "데이터 저장 위치", "보유·이용 기간"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 border border-[#e5e7eb] font-medium text-[#101828] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">Supabase Inc.</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">데이터베이스 및 인증</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">필수·선택 수집 항목</td>
                  <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">대한민국 (서울 리전)</td>
                  <td className="px-3 py-2 border border-[#e5e7eb]">회원 탈퇴 또는 위탁 계약 종료 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-medium text-[#101828] mb-2">7-2. 국외 이전</h3>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f9fafb]">
                  {["이전받는 자", "이전 국가", "이용 목적", "이전 항목", "이전 일시 및 방법", "보유·이용 기간"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 border border-[#e5e7eb] font-medium text-[#101828] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ...(!isAppsInToss ? [["Google LLC", "미국", "외부 인증 서비스 및 OAuth 로그인 제공", "이메일 주소, 계정 식별자, 프로필 사진", "로그인 시점에 네트워크를 통한 전송"]] : []),
                  ["Resend Inc.", "미국", "이메일 알림 발송", "이메일 주소", "이메일 발송 시점에 네트워크를 통한 전송"],
                  ["Vercel Inc.", "미국", "서비스 호스팅", "IP 주소, 접속 로그, 요청 정보", "서비스 이용 시점에 네트워크를 통한 전송"],
                ].map(([company, country, purpose, items, method]) => (
                  <tr key={company}>
                    <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">{company}</td>
                    <td className="px-3 py-2 border border-[#e5e7eb] whitespace-nowrap">{country}</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">{purpose}</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">{items}</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">{method}</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">회원 탈퇴, 위탁 계약 종료 또는 각 수탁업체의 보관 정책에 따른 보유기간 종료 시까지</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[13px] text-[#6b7280]">각 수탁업체의 로그 및 보안 기록은 해당 업체의 개인정보 처리방침과 보관 정책에 따라 일정 기간 보관될 수 있습니다. 각 업체의 연락처 및 개인정보 처리 내용은 해당 업체의 개인정보 처리방침에서 확인할 수 있습니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">8. 개인정보의 안전성 확보 조치</h2>
          <p className="mb-2">운영자는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취합니다.</p>
          <ul className="flex flex-col gap-1 pl-4">
            {[
              `비밀번호를 직접 저장하지 않고 외부 인증 서비스(${isAppsInToss ? "토스 로그인" : "Google OAuth"})를 이용`,
              "개인정보 전송 구간의 암호화(HTTPS)",
              "개인정보 처리 시스템에 대한 접근 권한의 최소화",
              "클라우드 서비스의 접근 기록 관리 및 보안 설정 관리",
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#ae49fd] shrink-0">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">9. 정보주체의 권리 및 행사 방법</h2>
          <p>이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다. 마이페이지에서 직접 수정·탈퇴하거나, 위 문의 이메일로 요청할 수 있습니다. 운영자는 요청자가 가입 시 사용한 이메일과 동일한지 등 본인 여부를 확인한 후 관계 법령에 따라 지체 없이 조치합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">10. 개인정보 보호책임자</h2>
          <ul className="flex flex-col gap-1">
            <li>개인정보 보호책임자: nove 대표</li>
            <li>이메일: <a href="mailto:thenovelabs@gmail.com" className="underline hover:text-[#ae49fd] transition-colors">thenovelabs@gmail.com</a></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">11. 권익침해 구제 방법</h2>
          <p className="mb-2">개인정보 침해로 인한 상담 및 신고가 필요한 경우 아래 기관에 문의할 수 있습니다.</p>
          <ul className="flex flex-col gap-1 pl-4">
            {[
              "개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)",
              "개인정보침해신고센터: 118 (privacy.kisa.or.kr)",
              "대검찰청 사이버수사과: 1301 (www.spo.go.kr)",
              "경찰청 사이버수사국: 182 (ecrm.cyber.go.kr)",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#ae49fd] shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">12. 변경 사항 고지</h2>
          <p>개인정보 처리방침이 변경되는 경우 서비스 내 공지사항을 통해 안내합니다.</p>
        </div>
      </section>
    </div>
  );
}
