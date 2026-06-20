import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPostById, updatePost, uploadBoardImage, deleteBoardImage } from "../api/board";
import { useToast } from "../components/toastContext";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";
import { useUser } from "../contexts/userContextValue";

const CATEGORIES = ["일반", "모각작 후기", "바이브코딩 꿀팁", "바이브코딩 질문"] as const;
type Category = (typeof CATEGORIES)[number];
const MAX_IMAGES = 3;

export default function BoardPostEditScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    getPostById(id)
      .then((p) => {
        if (!p) return;
        setContent(p.content);
        setCategory(p.category as Category);
        setExistingUrls(p.image_urls ?? []);
        requestAnimationFrame(() => {
          const el = contentRef.current;
          if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
        });
      })
      .catch(() => toast("게시글을 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const totalCurrent = existingUrls.length + newFiles.length;
    const toAdd = files.slice(0, MAX_IMAGES - totalCurrent);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    setNewFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  }

  function removeExisting(url: string) {
    setExistingUrls((prev) => prev.filter((u) => u !== url));
    setRemovedUrls((prev) => [...prev, url]);
  }

  function removeNew(idx: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!id || !content.trim() || !category) return;
    setSaving(true);
    try {
      await Promise.all(removedUrls.map(deleteBoardImage));
      const uploaded = await Promise.all(
        newFiles.map((f) => uploadBoardImage(session!.user.id, f))
      );
      await updatePost(id, {
        content: content.trim(),
        category,
        imageUrls: [...existingUrls, ...uploaded],
      });
      toast("수정됐어요", "success");
      navigate(`/board/${id}`);
    } catch {
      toast("저장에 실패했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  }

  const totalImages = existingUrls.length + newFiles.length;
  const isValid = content.trim() && category !== "";
  const blocker = useUnsavedChanges(!loading && !saving);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {blocker.state === "blocked" && (
        <ConfirmModal
          title="수정 중인 내용이 있어요"
          message="페이지를 나가면 수정한 내용이 모두 사라져요."
          confirmLabel="나가기"
          onConfirm={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        />
      )}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pt-6 pb-4">
        <div className="max-w-xl lg:mx-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">글 수정</h1>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                    category === c ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  const el = contentRef.current;
                  if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                }}
                placeholder="이야기를 나눠보세요"
                maxLength={1000}
                rows={10}
                className="input resize-none overflow-hidden leading-relaxed"
              />
              <p className="text-right text-[12px] text-[#99a1af] mt-1.5">{content.length}/1000</p>
            </div>

            {/* 이미지 관리 */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <div className="flex gap-2 flex-wrap">
                {existingUrls.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-[12px] overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExisting(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {newPreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative w-20 h-20 rounded-[12px] overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNew(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {totalImages < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-[12px] border-2 border-dashed border-[#d1d5dc] flex flex-col items-center justify-center gap-1 text-[#99a1af] hover:border-[#ae49fd] hover:text-[#ae49fd] transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[10px] font-medium">{totalImages}/{MAX_IMAGES}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6]">
        <div className="max-w-xl lg:mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-[16px] bg-[#f1f3f7] text-[#6a7282] text-[14px] font-bold rounded-[16px] hover:bg-[#e9eaec] transition-colors"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving || !isValid}
            className="flex-1 py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
