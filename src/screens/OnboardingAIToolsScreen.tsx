import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/userContextValue";
import { updateUserAITools } from "../api/users";
import { features } from "../config/features";

const AI_TOOLS = [
  "ChatGPT",
  "Claude",
  "Cursor",
  "GitHub Copilot",
  "Gemini",
  "Windsurf",
  "v0",
  "Perplexity",
  "Bolt",
  "Lovable",
  "Replit",
  "Cline",
];

export default function OnboardingAIToolsScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [showCustomInput]);

  function toggle(tool: string) {
    setSelected((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val || selected.includes(val)) { setCustomInput(""); return; }
    setSelected((prev) => [...prev, val]);
    setCustomInput("");
  }

  async function onNext() {
    if (!session || saving) return;
    setSaving(true);
    await updateUserAITools(session.user.id, selected);
    setSaving(false);
    navigate("/onboarding/job");
  }

  function onSkip() {
    navigate("/onboarding/job");
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
            <div className="h-1 rounded-full bg-[#f1f3f7] flex-1" />
          </div>

          <h2 className="text-[20px] font-bold text-[#101828] mb-1">주로 쓰는 AI 툴이 뭔가요?</h2>
          <p className="text-[14px] text-[#99a1af] mb-8">여러 개 선택할 수 있어요</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {AI_TOOLS.map((tool) => (
              <button
                key={tool}
                onClick={() => toggle(tool)}
                className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                  selected.includes(tool)
                    ? "bg-[#f4e5ff] text-[#ae49fd]"
                    : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"
                }`}
              >
                {tool}
              </button>
            ))}
            {selected.filter((t) => !AI_TOOLS.includes(t)).map((tool) => (
              <button
                key={tool}
                onClick={() => toggle(tool)}
                className="px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-[#f4e5ff] text-[#ae49fd] transition-colors flex items-center gap-1.5"
              >
                {tool}
                <span className="opacity-60 text-[12px]">✕</span>
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput((v) => !v)}
              className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors flex items-center gap-1 ${
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
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) addCustom(); }}
                placeholder="사용하는 AI 툴을 입력하세요"
                className="flex-1 px-4 py-3 rounded-[12px] text-[14px] outline-none bg-[#f9fafb] text-[#101828] placeholder:text-[#99a1af] focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
              />
              <button
                onClick={addCustom}
                disabled={!customInput.trim()}
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
              onClick={onNext}
              disabled={selected.length === 0 || saving}
              className="w-full py-4 bg-[#ae49fd] text-white text-[16px] font-bold rounded-2xl disabled:opacity-40 transition-opacity"
            >
              {saving ? "저장 중..." : "다음"}
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
