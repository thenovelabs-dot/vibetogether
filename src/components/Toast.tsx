import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "error") => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-[72px] lg:bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-[14px] shadow-lg text-white text-[14px] font-semibold tracking-[-0.32px] pointer-events-auto max-w-sm w-full text-center ${
              t.type === "error"
                ? "bg-[#ef4444]"
                : t.type === "success"
                  ? "bg-[#22c55e]"
                  : "bg-[#101828]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
