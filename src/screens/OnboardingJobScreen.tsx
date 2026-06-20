import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/userContextValue";
import { updateUserJobRole } from "../api/users";
import { features } from "../config/features";

const JOB_ROLES = [
  { id: "developer", label: "개발자" },
  { id: "designer", label: "디자이너" },
  { id: "pm", label: "기획자 / PM" },
  { id: "marketer", label: "마케터" },
  { id: "ceo", label: "대표 / CEO" },
  { id: "investor", label: "투자자" },
  { id: "sales", label: "세일즈" },
  { id: "content", label: "콘텐츠" },
  { id: "data", label: "데이터" },
];

export default function OnboardingJobScreen() {
  const navigate = useNavigate();
  const { session, refreshProfile } = useUser();
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customJobInput, setCustomJobInput] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [showCustomInput]);

  async function onComplete() {
    if (!session || saving) return;
    setSaving(true);
    await updateUserJobRole(session.user.id, selected);
    await refreshProfile();
    setSaving(false);
    navigate(features.meetups ? "/meetup" : "/home", { replace: true });
  }

  async function onSkip() {
    await refreshProfile();
    navigate(features.meetups ? "/meetup" : "/home", { replace: true });
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex flex-col justify-center px-16 bg-[#ae49fd]" style={{ width: "45%" }}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8">💻</div>
        <h1 className="text-[36px] font-bold text-white mb-3">같이바코할사람</h1>
        <p className="text-[18px] text-white/70 leading-relaxed mb-10">
          {features.meetups ? <>동네에서 바이브코딩 모임을<br />열고 참여하는 서비스</> : <>바이브코딩 프로덕트와<br />노하우를 나누는 서비스</>}
        </p>
        <div className="space-y-3">
          {(features.meetups
            ? ["내 동네 기반으로 모임 찾기", "함께하면 더 집중되는 작업 시간", "같은 관심사를 가진 사람들과 교류"]
            : ["프로덕트 쇼케이스 둘러보기", "게시판에서 노하우 공유", "같은 관심사의 메이커 발견"]
          ).map((text) => <Feature key={text} text={text} />)}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-6 py-12 lg:py-16 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-10">
            <div className="h-1 rounded-full bg-[#ae49fd] flex-1" />
            <div className="h-1 rounded-full bg-[#ae49fd] flex-1" />
            <div className="h-1 rounded-full bg-[#ae49fd] flex-1" />
          </div>

          <h2 className="text-[20px] font-bold text-[#101828] mb-1">어떤 일을 하고 계세요?</h2>
          <p className="text-[14px] text-[#99a1af] mb-8">비슷한 포지션 사람들과 연결돼요</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {JOB_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => { setSelected(role.id); setShowCustomInput(false); }}
                className={`py-3.5 px-4 rounded-xl text-[14px] font-semibold text-left transition-colors ${
                  selected === role.id
                    ? "bg-[#f4e5ff] text-[#ae49fd]"
                    : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"
                }`}
              >
                {role.label}
              </button>
            ))}
            <button
              onClick={() => {
                setShowCustomInput((v) => !v);
                setSelected("");
              }}
              className={`py-3.5 px-4 rounded-xl text-[14px] font-semibold text-left transition-colors flex items-center gap-1 ${
                showCustomInput
                  ? "bg-[#f4e5ff] text-[#ae49fd]"
                  : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"
              }`}
            >
              직접입력
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showCustomInput ? "max-h-20 opacity-100 mb-4" : "max-h-0 opacity-0 mb-0"}`}>
            <div className="flex gap-2">
              <input
                ref={customInputRef}
                value={customJobInput}
                onChange={(e) => { setCustomJobInput(e.target.value); setSelected(e.target.value.trim()); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing && customJobInput.trim()) setShowCustomInput(false); }}
                placeholder="직업을 입력하세요"
                className="flex-1 px-4 py-3 rounded-[12px] text-[14px] outline-none bg-[#f9fafb] text-[#101828] placeholder:text-[#99a1af] focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
              />
              <button
                onClick={() => { if (customJobInput.trim()) setShowCustomInput(false); }}
                disabled={!customJobInput.trim()}
                className="w-12 h-12 rounded-[12px] bg-[#ae49fd] text-white shrink-0 disabled:opacity-40 flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-auto pb-2 safe-bottom space-y-2">
            <button
              onClick={onComplete}
              disabled={!selected || saving}
              className="w-full py-4 bg-[#ae49fd] text-white text-[16px] font-bold rounded-2xl disabled:opacity-40 transition-opacity"
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
            <button
              onClick={onSkip}
              className="w-full py-3.5 text-[#99a1af] text-[14px] font-semibold hover:text-[#6a7282] transition-colors"
            >
              건너뛰기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/80 text-[16px]">
      <div className="w-1.5 h-1.5 bg-white/60 rounded-full shrink-0" />
      {text}
    </div>
  );
}
