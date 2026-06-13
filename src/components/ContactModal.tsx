import { useState } from "react";
import { sendContactEmail } from "../api/contact";
import { useToast } from "./Toast";

const INQUIRY_TAGS = ["질문", "불편한 점", "기능 제안", "버그 신고", "기타", "직접 입력"];
const REPORT_TAGS = ["스팸", "허위 정보", "부적절한 콘텐츠", "저작권 침해", "기타", "직접 입력"];

interface ContactModalProps {
  type: "inquiry" | "report";
  senderEmail?: string;
  targetInfo?: { type: string; title: string; id: string };
  onClose: () => void;
}

export function ContactModal({ type, senderEmail = "", targetInfo, onClose }: ContactModalProps) {
  const { toast } = useToast();
  const tags = type === "inquiry" ? INQUIRY_TAGS : REPORT_TAGS;
  const [selectedTag, setSelectedTag] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState(senderEmail);
  const [sending, setSending] = useState(false);

  const isCustom = selectedTag === "직접 입력";
  const finalTag = isCustom ? customTag.trim() : selectedTag;
  const isValid = finalTag && content.trim() && email.trim();

  async function submit() {
    if (!isValid || sending) return;
    setSending(true);
    try {
      await sendContactEmail({ type, tag: finalTag, content: content.trim(), senderEmail: email.trim(), targetInfo });
      toast(type === "inquiry" ? "문의가 전송됐어요" : "신고가 접수됐어요", "success");
      onClose();
    } catch {
      toast("전송에 실패했어요. 다시 시도해주세요");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-[480px] rounded-t-[24px] sm:rounded-[24px] px-5 pt-6 pb-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#101828] tracking-[-0.32px]">
            {type === "inquiry" ? "문의하기" : "신고하기"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f3f4f6] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#6a7282" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {targetInfo && (
          <div className="bg-[#f9fafb] rounded-[12px] px-3 py-2.5">
            <p className="text-[12px] text-[#99a1af] tracking-[-0.32px]">신고 대상</p>
            <p className="text-[13px] font-semibold text-[#364153] mt-0.5 tracking-[-0.32px] truncate">{targetInfo.title}</p>
          </div>
        )}

        <div>
          <p className="text-[13px] font-semibold text-[#364153] mb-2 tracking-[-0.32px]">
            {type === "inquiry" ? "문의 유형" : "신고 유형"}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  selectedTag === tag ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {isCustom && (
            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="유형을 직접 입력해주세요"
              maxLength={30}
              className="input mt-2"
            />
          )}
        </div>

        <div>
          <p className="text-[13px] font-semibold text-[#364153] mb-2 tracking-[-0.32px]">내용</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === "inquiry" ? "문의 내용을 입력해주세요" : "신고 이유를 입력해주세요"}
            maxLength={1000}
            rows={5}
            className="input resize-none leading-relaxed"
          />
          <p className="text-right text-[11px] text-[#99a1af] mt-1">{content.length}/1000</p>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-[#364153] mb-2 tracking-[-0.32px]">회신 받을 이메일</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="input"
          />
        </div>

        <button
          onClick={submit}
          disabled={!isValid || sending}
          className="w-full py-[15px] bg-[#ae49fd] text-white text-[15px] font-bold rounded-[14px] disabled:opacity-40 transition-opacity"
        >
          {sending ? "전송 중..." : "전송하기"}
        </button>
      </div>
    </div>
  );
}
