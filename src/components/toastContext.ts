import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info" | "report";

export interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);
