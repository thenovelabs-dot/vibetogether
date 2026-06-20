import { useCallback, useRef, useState } from "react";
import { ToastContext, type ToastType } from "./toastContext";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  exiting: boolean;
}

function WarningIcon() {
  return <img src="/icons/warning.svg" width={24} height={24} className="shrink-0" />;
}

function LinkIcon() {
  return <img src="/icons/link.svg" width={24} height={24} className="shrink-0" />;
}

function CheckIcon() {
  return (
    <div className="w-6 h-6 flex items-center justify-center shrink-0">
      <div className="w-5 h-5 rounded-full bg-[#ae49fd] flex items-center justify-center">
        <svg width="11" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

function ReportIcon() {
  return <img src="/icons/report.svg" width={24} height={24} className="shrink-0" />;
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") return <CheckIcon />;
  if (type === "info") return <LinkIcon />;
  if (type === "report") return <ReportIcon />;
  return <WarningIcon />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "error") => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    // 퇴장 애니메이션 시작 (300ms 후 제거)
    setTimeout(() => setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t)), 2700);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-6 left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: `${t.exiting ? "toast-out" : "toast-in"} 0.3s ease forwards` }}
            className="flex items-center justify-center gap-2 bg-white px-5 py-4 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] pointer-events-auto max-w-sm w-full"
          >
            <ToastIcon type={t.type} />
            <span className="text-[#101828] text-[16px] font-semibold tracking-[-0.32px] leading-[22.4px]">
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
