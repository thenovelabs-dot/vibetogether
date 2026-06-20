import { useRef } from "react";
import { NavigationGuardContext, type Guard, type GuardContextValue } from "./navigationGuard";

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const guardRef = useRef<Guard | null>(null);

  const value: GuardContextValue = {
    register: (guard) => { guardRef.current = guard; },
    unregister: () => { guardRef.current = null; },
    tryNavigate: (navigate, path) => {
      if (guardRef.current?.isDirty()) {
        guardRef.current.onBlock(path);
      } else {
        navigate(path);
      }
    },
  };

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
}
