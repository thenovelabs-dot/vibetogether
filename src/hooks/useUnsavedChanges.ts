import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationGuard } from "../contexts/navigationGuard";

export function useUnsavedChanges(isDirty: boolean) {
  const [state, setState] = useState<"idle" | "blocked">("idle");
  const navigate = useNavigate();
  const guard = useNavigationGuard();
  const isDirtyRef = useRef(false);
  const proceedingRef = useRef(false);
  // null = back button block, string = in-app nav destination
  const pendingRef = useRef<string | null | undefined>(undefined);

  isDirtyRef.current = isDirty;

  // 사이드바/탭 등 인앱 네비게이션 차단 등록
  useEffect(() => {
    if (!isDirty) {
      guard.unregister();
      return;
    }
    guard.register({
      isDirty: () => isDirtyRef.current,
      onBlock: (path) => {
        pendingRef.current = path;
        setState("blocked");
      },
    });
    return () => guard.unregister();
  }, [isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  // 브라우저 닫기/새로고침 차단
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // 브라우저 뒤로가기 차단 (guard 상태 1개 push → proceed 시 -2로 탈출)
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (proceedingRef.current) { proceedingRef.current = false; return; }
      if (isDirtyRef.current) {
        window.history.pushState(null, "", window.location.href);
        pendingRef.current = null; // 뒤로가기
        setState("blocked");
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isDirty]);

  const proceed = useCallback(() => {
    setState("idle");
    const pending = pendingRef.current;
    pendingRef.current = undefined;

    if (typeof pending === "string") {
      // 인앱 네비게이션 — 목적지로 바로 이동
      navigate(pending);
    } else {
      // 뒤로가기 차단 — guard push 2개 넘어서 실제 이전 페이지로
      proceedingRef.current = true;
      navigate(-2);
    }
  }, [navigate]);

  const reset = useCallback(() => {
    setState("idle");
    pendingRef.current = undefined;
  }, []);

  return { state, proceed, reset };
}
