import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallbackScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const redirect = localStorage.getItem("loginRedirect");
        localStorage.removeItem("loginRedirect");
        navigate(redirect || "/meetup", { replace: true });
      } else {
        navigate("/onboarding/nickname", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-400 text-sm">로그인 중...</p>
    </div>
  );
}
