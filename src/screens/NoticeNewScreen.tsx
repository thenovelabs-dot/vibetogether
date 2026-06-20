import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createNotice, ADMIN_EMAIL } from "../api/notices";
import { useUser } from "../contexts/userContextValue";
import { supabase } from "../lib/supabase";
import { useToast } from "../components/toastContext";

export default function NoticeNewScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) { navigate("/notice", { replace: true }); return; }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email !== ADMIN_EMAIL) {
        navigate("/notice", { replace: true });
      } else {
        setAuthorized(true);
      }
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      const id = await createNotice({ title: title.trim(), content: content.trim() });
      navigate(`/notice/${id}`, { replace: true });
    } catch {
      toast("등록에 실패했어요. 다시 시도해주세요");
      setSaving(false);
    }
  }

  if (authorized === null) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pt-6 pb-4">
        <div className="max-w-xl lg:mx-auto flex flex-col gap-5">
          <div>
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">공지사항 작성</h1>
            <p className="text-[14px] text-[#99a1af] mt-1">관리자 전용 게시판입니다</p>
          </div>

          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              maxLength={100}
              className="input"
            />
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              maxLength={3000}
              rows={16}
              className="input resize-none leading-relaxed"
            />
            <p className="text-right text-[12px] text-[#99a1af] mt-1.5">{content.length}/3000</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6]">
        <div className="max-w-xl lg:mx-auto">
          <button
            onClick={submit}
            disabled={!title.trim() || !content.trim() || saving}
            className="w-full py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity"
          >
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
