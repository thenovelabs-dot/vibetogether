import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNoticeById, deleteNotice, ADMIN_EMAIL, type Notice } from "../api/notices";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../lib/supabase";
import { ConfirmModal } from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

export default function NoticeDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useUser();
  const { toast } = useToast();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session) {
      supabase.auth.getUser().then(({ data }) => setAdminEmail(data.user?.email ?? null));
    }
  }, [session]);

  useEffect(() => {
    if (!id) return;
    getNoticeById(id)
      .then(setNotice)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteNotice(id);
      navigate("/notice", { replace: true });
    } catch {
      toast("삭제에 실패했어요");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const isAdmin = adminEmail === ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[14px] text-[#99a1af]">공지사항을 찾을 수 없어요</p>
      </div>
    );
  }

  const date = new Date(notice.created_at);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dateStr = `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}(${days[date.getDay()]})`;

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      {confirmDelete && (
        <ConfirmModal
          title="공지사항 삭제"
          message="삭제하면 복구할 수 없어요. 정말 삭제할까요?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}

      <div className="px-4 py-6 flex flex-col gap-4">
        {/* 본문 카드 */}
        <div className="bg-white rounded-[16px] px-5 py-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[18px] font-bold text-[#101828] leading-snug tracking-[-0.32px] flex-1">{notice.title}</h1>
            {isAdmin && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="shrink-0 text-[12px] font-semibold text-[#99a1af] hover:text-red-400 transition-colors"
              >
                삭제
              </button>
            )}
          </div>
          <p className="text-[12px] text-[#99a1af] tracking-[-0.32px]">같이바코할사람 · {dateStr}</p>
          <div className="border-t border-[#f3f4f6]" />
          <p className="text-[14px] leading-[24px] text-[#2a2d33] tracking-[-0.32px] whitespace-pre-line">
            {notice.content}
          </p>
        </div>

        {/* 문의하기 */}
        <div className="bg-white rounded-[16px] px-5 py-4 flex items-center justify-between">
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
