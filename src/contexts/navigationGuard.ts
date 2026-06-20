import { createContext, useContext } from "react";

export interface Guard {
  isDirty: () => boolean;
  onBlock: (path: string) => void;
}

export interface GuardContextValue {
  register: (guard: Guard) => void;
  unregister: () => void;
  tryNavigate: (navigate: (path: string) => void, path: string) => void;
}

export const NavigationGuardContext = createContext<GuardContextValue>({
  register: () => {},
  unregister: () => {},
  tryNavigate: (nav, path) => nav(path),
});

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
