import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useUser } from "../contexts/userContextValue";
import { features } from "../config/features";

export function LoginPromptModal() {
  const { signInWithGoogle } = useUser();
  const location = useLocation();

  function handleSignIn() {
    if (!features.googleLogin) return;
    localStorage.setItem("loginRedirect", location.pathname);
    signInWithGoogle();
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] px-6 pt-8 pb-10 shadow-xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-[14px] bg-[#f4e5ff] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="none"/>
            <circle cx="12" cy="12" r="10" stroke="#ae49fd" strokeWidth="1.8"/>
            <path d="M12 8v4l3 3" stroke="#ae49fd" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>

        <h2 className="text-[18px] font-bold text-[#101828] mb-2 tracking-[-0.32px]">
          로그인이 필요해요
        </h2>
        <p className="text-[14px] text-[#6a7282] mb-7 tracking-[-0.32px] leading-relaxed">
          {features.googleLogin ? (
            <>상세 내용은 로그인 후 볼 수 있어요.<br />Google 계정으로 빠르게 시작해보세요.</>
          ) : (
            <>로그인 기능은 토스 로그인 연동 후 사용할 수 있어요.</>
          )}
        </p>

        <button
          onClick={handleSignIn}
          disabled={!features.googleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-[#d1d5dc] rounded-[14px] text-[15px] font-semibold text-[#101828] hover:bg-[#f9fafb] transition-colors mb-3 disabled:opacity-60"
        >
          {features.googleLogin ? <GoogleMark /> : <span className="w-5 h-5 rounded-full bg-[#ae49fd]" />}
          {features.googleLogin ? "Google로 계속하기" : "토스 로그인 준비 중"}
        </button>

        <p className="text-[12px] text-[#99a1af] tracking-[-0.32px]">
          가입하면 <span className="text-[#ae49fd]">같이바코할사람</span> 이용약관에 동의하게 됩니다
        </p>
      </div>
    </div>,
    document.body
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    </svg>
  );
}
