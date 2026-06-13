import { useState } from "react";
import { useUser } from "../contexts/UserContext";

export default function LoginScreen() {
  const { signInWithGoogle } = useUser();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const existing = localStorage.getItem("loginRedirect");
    if (!existing || existing === "/login") {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (from) localStorage.setItem("loginRedirect", from);
    }
    await signInWithGoogle();
  }

  return (
    <div className="flex h-screen">
      {/* 좌측 브랜드 패널 (데스크탑) */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-[#ae49fd]" style={{ width: "45%" }}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8">💻</div>
        <h1 className="text-[36px] font-bold text-white mb-3">같이바코할사람</h1>
        <p className="text-[18px] text-white/70 leading-relaxed mb-10">
          동네에서 바이브코딩 모임을<br />열고 참여하는 서비스
        </p>
        <div className="space-y-3">
          <Feature text="내 동네 기반으로 모임 찾기" />
          <Feature text="함께하면 더 집중되는 작업 시간" />
          <Feature text="같은 관심사를 가진 사람들과 교류" />
        </div>
      </div>

      {/* 우측 로그인 */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">같이바코할사람</h1>
            <p className="text-gray-400 text-sm">동네에서 바이브코딩 모임 열고 참여하기</p>
          </div>
          <h2 className="hidden lg:block text-[20px] font-bold text-[#101828] mb-2">시작하기</h2>
          <p className="hidden lg:block text-[14px] text-[#99a1af] mb-8">Google 계정으로 바로 시작하세요</p>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 px-4 text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#ae49fd] rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Google 로그인 중..." : "Google로 시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/80 text-[16px]">
      <div className="w-1.5 h-1.5 bg-white/60 rounded-full shrink-0" />
      {text}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.31Z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.58A10 10 0 0 0 10 20Z" fill="#34A853"/>
      <path d="M4.41 11.91A6.01 6.01 0 0 1 4.1 10c0-.66.11-1.3.31-1.91V5.51H1.07A10 10 0 0 0 0 10c0 1.61.39 3.14 1.07 4.49l3.34-2.58Z" fill="#FBBC05"/>
      <path d="M10 3.97c1.47 0 2.79.5 3.82 1.5l2.86-2.86C14.95.99 12.7 0 10 0A10 10 0 0 0 1.07 5.51l3.34 2.58C5.2 5.73 7.4 3.97 10 3.97Z" fill="#EA4335"/>
    </svg>
  );
}
