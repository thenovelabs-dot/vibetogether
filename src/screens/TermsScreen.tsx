import { features } from "../config/features";

export default function TermsScreen() {
  const isMeetupEnabled = features.meetups;
  const isCoffeechatEnabled = features.coffeechat;

  return (
    <div className="px-4 py-8 max-w-[720px] mx-auto">
      <h1 className="text-[22px] font-bold text-[#101828] tracking-[-0.32px] mb-1">이용약관</h1>
      <p className="text-[13px] text-[#99a1af] mb-8">시행일: 2026년 6월 14일</p>

      <section className="flex flex-col gap-6 text-[14px] leading-relaxed text-[#364153]">
        <div>
          <h2 className="font-bold text-[#101828] mb-2">제1조 (목적)</h2>
          <p>이 약관은 nove(이하 "운영자")가 운영하는 같이바코할사람(이하 "서비스")의 이용 조건 및 절차, 운영자와 이용자의 권리·의무에 관한 사항을 규정합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제2조 (이용 자격 및 약관 동의)</h2>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="flex gap-2"><span className="shrink-0">①</span><span>서비스는 만 14세 이상이면 누구나 이용할 수 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">②</span><span>이용자는 {features.tossLogin ? "토스 로그인" : "Google 계정"}을 통한 로그인 또는 회원가입 과정에서 본 약관 및 개인정보 처리방침에 동의하고, 만 14세 이상임을 확인해야 서비스를 이용할 수 있습니다.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제3조 (금지 행위)</h2>
          <p className="mb-2">이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="flex flex-col gap-1 pl-4">
            {[
              "타인을 사칭하거나 허위 정보를 등록하는 행위",
              "다른 이용자의 개인정보를 무단으로 수집·저장·공개·유포하는 행위",
              ...(isCoffeechatEnabled ? ["커피챗을 통해 공개받은 상대방의 이메일을 일정 조율 및 직접 연락 외의 목적으로 사용하는 행위"] : []),
              "다른 이용자에게 계정, API 키, 유료 도구 접근 권한 등의 공유를 요청하거나 금전적 손실을 발생시킬 수 있는 행위",
              "성희롱, 혐오·차별적 발언, 위협, 스토킹 등 다른 이용자를 괴롭히는 행위",
              "상업적 광고, 스팸성 게시물 반복 등록",
              ...(isMeetupEnabled ? [
                "투자·채용·종교·다단계·사기성 권유 등 모임 취지와 무관하거나 상대방이 원하지 않는 권유 행위",
                "불법적이거나 유해한 모임을 개설하는 행위",
              ] : []),
              "타인의 저작권·초상권·개인정보를 침해하는 게시물 등록",
              "외부 링크를 통한 피싱, 악성코드 유포",
              "운영자의 사전 동의 없는 크롤링, 자동화된 접근 등 서비스의 정상적인 운영을 방해하는 행위",
              ...(isMeetupEnabled ? ["모임을 등록 후 사전 안내 없이 반복적으로 취소하는 행위"] : []),
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#ae49fd] shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {(isMeetupEnabled || isCoffeechatEnabled) && (
          <div>
            <h2 className="font-bold text-[#101828] mb-2">제4조 (모임 및 커피챗)</h2>
            <ul className="flex flex-col gap-2 pl-4">
              {isMeetupEnabled && <li className="flex gap-2"><span className="shrink-0">①</span><span>모임 호스트는 모임 정보를 정확하게 작성할 책임이 있습니다.</span></li>}
              {isMeetupEnabled && isCoffeechatEnabled && <li className="flex gap-2"><span className="shrink-0">②</span><span>운영자는 이용자 간 모임 및 커피챗 연결을 중개할 뿐, 실제 모임 진행 및 개인 간 연락에 대한 책임을 지지 않습니다.</span></li>}
              {isCoffeechatEnabled && <li className="flex gap-2"><span className="shrink-0">③</span><span>커피챗 수락 시 수락한 이용자의 이메일 주소가 상대방에게 공개됩니다. 이는 이용자 간 직접 연락을 위한 개인정보의 제3자 제공에 해당하며, 이용자는 커피챗 수락 시점에 이메일 공개에 명시적으로 동의한 경우에만 수락할 수 있습니다.</span></li>}
              {isMeetupEnabled && <li className="flex gap-2"><span className="shrink-0">④</span><span>모임 호스트 또는 참여자는 부득이하게 모임을 취소하거나 참석이 어려운 경우 상대방에게 사전에 안내해야 합니다.</span></li>}
              <li className="flex gap-2"><span className="shrink-0">⑤</span><span>이용자 간 협업 과정에서 제공되는 코드, 조언, 자료, 결과물의 정확성·적법성·안전성에 대한 책임은 이를 제공하거나 사용하는 이용자에게 있습니다.</span></li>
            </ul>
          </div>
        )}

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제5조 (게시물)</h2>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="flex gap-2"><span className="shrink-0">①</span><span>이용자가 작성한 게시물의 저작권은 이용자 본인에게 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">②</span><span>이용자는 서비스 제공, 게시물 노출, 검색, 백업, 캐싱을 위해 필요한 범위 내에서 운영자가 게시물을 저장·복제·전송·전시할 수 있는 비독점적·무상의 권리를 부여합니다. 이 권리는 서비스 운영에 필요한 범위로 한정됩니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">③</span><span>제3조 금지 행위에 해당하거나 신고가 접수되어 운영상 필요하다고 판단되는 게시물은 삭제 또는 노출 제한될 수 있으며, 필요한 경우 운영자는 이용자에게 그 사유를 통지할 수 있습니다.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제6조 (신고 및 안전)</h2>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="flex gap-2"><span className="shrink-0">①</span><span>이용자는 부적절한 게시물, 댓글, 프로덕트 정보, 괴롭힘 행위 등을 운영자에게 신고할 수 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">②</span><span>이용자는 서비스 이용 중 개인정보·금전·계정 정보 등을 타인에게 제공할 때 주의해야 합니다.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제7조 (서비스 변경 및 중단)</h2>
          <p>운영자는 서비스의 내용을 변경하거나 중단할 수 있으며, 중요한 변경 사항은 서비스 내 공지사항을 통해 안내합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제8조 (면책)</h2>
          <p>운영자는 이용자 간 직접 연락, 협업 과정에서 발생한 분쟁에 관여하지 않으며 이에 대한 책임을 부담하지 않습니다. 다만 운영자의 고의 또는 중대한 과실로 인한 손해에 대해서는 관련 법령에 따라 책임을 부담합니다.</p>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제9조 (이용 제한 및 탈퇴)</h2>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="flex gap-2"><span className="shrink-0">①</span><span>운영자는 이용자가 금지 행위를 하거나 서비스 운영을 방해하는 경우 게시물 삭제, 이용 제한, 계정 정지 등의 조치를 할 수 있습니다. 이러한 조치는 사전에 통지하는 것을 원칙으로 하되, 긴급한 피해 방지 또는 법령 위반 우려가 있는 경우 조치 후 통지할 수 있습니다. 통지는 서비스 내 알림, 이메일 또는 기타 합리적인 방법으로 할 수 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">②</span><span>이용자는 이용 제한 조치에 이의가 있는 경우 운영자 문의 이메일을 통해 이의를 제기할 수 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">③</span><span>이용자는 마이페이지에서 언제든지 탈퇴할 수 있습니다. 탈퇴 시 회원정보는 지체 없이 파기되나, 이용자가 작성한 게시물은 작성자 식별정보를 분리하거나 비식별 처리한 후 서비스 내에 유지될 수 있습니다. 다만 게시물 내용 자체에 개인정보가 포함된 경우 이용자는 탈퇴 전 직접 삭제하거나 운영자에게 삭제를 요청할 수 있습니다.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제10조 (약관의 변경)</h2>
          <ul className="flex flex-col gap-2 pl-4">
            <li className="flex gap-2"><span className="shrink-0">①</span><span>운영자는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있습니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">②</span><span>약관을 변경하는 경우 적용일자 및 변경 사유를 명시하여 적용일 7일 전부터 서비스 내 공지사항을 통해 공지합니다. 다만 이용자에게 불리하거나 중대한 변경의 경우 적용일 30일 전부터 공지합니다.</span></li>
            <li className="flex gap-2"><span className="shrink-0">③</span><span>변경된 약관에 동의하지 않는 이용자는 적용일 전까지 거부 의사를 밝히고 서비스 이용을 중단하거나 탈퇴할 수 있습니다. 공지된 적용일 이후에도 거부 의사 없이 서비스를 계속 이용하는 경우 변경된 약관에 동의한 것으로 봅니다. 다만 이용자에게 불리하거나 중대한 변경의 경우 운영자는 별도의 동의를 받을 수 있습니다.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-[#101828] mb-2">제11조 (준거법 및 관할)</h2>
          <p>이 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여 분쟁이 발생한 경우 관할 법원은 민사소송법에 따른 법원으로 합니다.</p>
        </div>

        <div className="pt-2 border-t border-[#f3f4f6] text-[13px] text-[#99a1af]">
          <p>운영자: nove</p>
          <p>문의: <a href="mailto:thenovelabs@gmail.com" className="underline hover:text-[#ae49fd] transition-colors">thenovelabs@gmail.com</a></p>
        </div>
      </section>
    </div>
  );
}
