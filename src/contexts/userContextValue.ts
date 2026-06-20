import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  nickname: string;
  region: string;
  lat: number | null;
  lng: number | null;
  ai_tools: string[] | null;
  job_role: string | null;
  avatar_url: string | null;
}

export interface UserState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithToss: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const UserContext = createContext<UserState | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
