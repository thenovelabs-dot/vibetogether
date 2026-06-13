import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface UserProfile {
  id: string;
  nickname: string;
  region: string;
  lat: number | null;
  lng: number | null;
  ai_tools: string[] | null;
  job_role: string | null;
  avatar_url: string | null;
}

interface UserState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserState | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data ?? null);
  }

  async function refreshProfile() {
    if (session?.user.id) await fetchProfile(session.user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    console.log("[OAuth] Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("[OAuth] redirectTo:", `${window.location.origin}/auth/callback`);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error("[signInWithGoogle]", error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ session, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
