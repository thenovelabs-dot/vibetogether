import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { appLogin } from "@apps-in-toss/web-bridge";
import { supabase } from "../lib/supabase";
import { UserContext, type UserProfile } from "./userContextValue";

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

  async function signInWithToss(): Promise<void> {
    const { authorizationCode, referrer } = await appLogin();
    const { data, error } = await supabase.functions.invoke<{
      success?: boolean;
      email?: string;
      otp?: string;
      error?: string;
    }>("toss-login", {
      body: { authorizationCode, referrer },
    });
    if (error || !data || data.error || !data.email || !data.otp) {
      throw new Error(data?.error ?? error?.message ?? "토스 로그인에 실패했어요");
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.otp,
      type: "email",
    });
    if (verifyError) throw verifyError;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ session, profile, loading, signInWithGoogle, signInWithToss, signOut, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}
