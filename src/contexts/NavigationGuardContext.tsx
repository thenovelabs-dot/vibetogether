import { createContext, useContext, useRef } from "react";

interface Guard {
  isDirty: () => boolean;
  onBlock: (path: string) => void;
}

interface GuardContextValue {
  register: (guard: Guard) => void;
  unregister: () => void;
  tryNavigate: (navigate: (path: string) => void, path: string) => void;
}

const NavigationGuardContext = createContext<GuardContextValue>({
  register: () => {},
  unregister: () => {},
  tryNavigate: (nav, path) => nav(path),
});

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

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
