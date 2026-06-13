import { useState } from "react";
import { useToast } from "./Toast";

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("링크가 복사됐어요");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        toast("링크가 복사됐어요");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast("링크 복사에 실패했어요");
      }
    }
  }

  return (
    <button
      onClick={share}
      className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#f5f6f7] hover:bg-[#e9eaec] transition-colors"
      title="링크 복사"
    >
      {copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 7" stroke="#ae49fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <img src="/icons/Share.svg" width={18} height={18} />
      )}
    </button>
  );
}
