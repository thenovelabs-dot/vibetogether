import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotices, ADMIN_EMAIL, type Notice } from "../api/notices";
import { useUser } from "../contexts/userContextValue";
import { supabase } from "../lib/supabase";

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function NoticeSkeleton() {
  return (
    <div className="bg-white rounded-[16px] px-5 py-4 flex flex-col gap-2 animate-pulse">
      <div className="h-4 w-2/3 bg-[#f0f2f4] rounded-md" />
      <div className="h-3 w-1/3 bg-[#f0f2f4] rounded-md" />
    </div>
  );
}

export default function NoticeScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      supabase.auth.getUser().then(({ data }) => {
        setAdminEmail(data.user?.email ?? null);
      });
    }
  }, [session]);

  useEffect(() => {
    getNotices()
      .then(setNotices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = adminEmail === ADMIN_EMAIL;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pt-6 pb-4 shrink-0 px-4">
        <h1 className="text-[20px] font-bold text-[#101828] tracking-[-0.32px]">공지사항</h1>
        {isAdmin && (
          <button
            onClick={() => navigate("/notice/new")}
            className="px-4 py-2 bg-[#101828] text-white text-[13px] font-semibold rounded-[10px]"
          >
            작성하기
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <NoticeSkeleton key={i} />)}
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-semibold text-[#101828] tracking-[-0.32px]">아직 공지사항이 없어요</p>
            <p className="text-[13px] text-[#99a1af] mt-1 tracking-[-0.32px]">업데이트 소식을 기다려주세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notices.map((notice, idx) => (
              <button
                key={notice.id}
                onClick={() => navigate(`/notice/${notice.id}`)}
                className="w-full text-left bg-white rounded-[16px] px-5 py-4 flex items-center justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow active:opacity-80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {idx === 0 && (
                    <span className="shrink-0 px-2 py-0.5 bg-[#f4e5ff] text-[#ae49fd] text-[11px] font-bold rounded-full">NEW</span>
                  )}
                  <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{notice.title}</p>
                </div>
                <span className="text-[12px] text-[#99a1af] shrink-0 ml-3">{relativeTime(notice.created_at)}</span>
              </button>
            ))}
          </div>
        )}

        {/* 문의하기 배너 */}
        <div className="mt-6 bg-white rounded-[16px] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px]">문의하기</p>
            <p className="text-[12px] text-[#99a1af] mt-0.5 tracking-[-0.32px]">불편한 점이나 건의사항을 보내주세요</p>
          </div>
          <a
            href="mailto:thenovelabs@gmail.com"
            className="px-4 py-2 bg-[#f4e5ff] text-[#ae49fd] text-[13px] font-semibold rounded-[10px] shrink-0"
          >
            메일 보내기
          </a>
        </div>
      </div>
    </div>
  );
}
