import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/userContextValue";
import { createPost, uploadBoardImage } from "../api/board";
import { useToast } from "../components/toastContext";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";

const CATEGORIES = ["일반", "모각작 후기", "바이브코딩 꿀팁", "바이브코딩 질문"] as const;
type Category = (typeof CATEGORIES)[number];
const MAX_IMAGES = 3;

export default function BoardPostNewScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("일반");
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = !!content.trim() || imageFiles.length > 0;
  const blocker = useUnsavedChanges(isDirty && !saving);
  const isValid = content.trim() && category !== "";

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (!session || !isValid || saving) return;
    setSaving(true);
    try {
      const imageUrls = await Promise.all(
        imageFiles.map((f) => uploadBoardImage(session.user.id, f))
      );
      const id = await createPost({
        userId: session.user.id,
        content: content.trim(),
        category: category as string,
        imageUrls,
      });
      navigate(`/board/${id}`, { replace: true });
    } catch {
      toast("등록에 실패했어요. 다시 시도해주세요");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {blocker.state === "blocked" && (
        <ConfirmModal
          title="작성 중인 내용이 있어요"
          message="페이지를 나가면 작성한 내용이 모두 사라져요."
          confirmLabel="나가기"
          onConfirm={() => blocker.proceed()}
          onCancel={() => blocker.reset()}
        />
      )}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 pt-6 pb-4">
        <div className="max-w-xl lg:mx-auto">
          <div className="mb-6">
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">글쓰기</h1>
            <p className="text-[14px] text-[#99a1af] mt-1">자유롭게 이야기를 나눠요</p>
          </div>

          <div className="flex flex-col gap-5">
            {/* 카테고리 */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                    category === c
                      ? "bg-[#f4e5ff] text-[#ae49fd]"
                      : "bg-[#f1f3f7] text-[#898f98]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* 본문 */}
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
              <p className="text-right text-[12px] text-[#99a1af] mt-1.5">
                {content.length}/1000
              </p>
            </div>

            {/* 이미지 업로드 */}
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
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-[12px] overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {imageFiles.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-[12px] border-2 border-dashed border-[#d1d5dc] flex flex-col items-center justify-center gap-1 text-[#99a1af] hover:border-[#ae49fd] hover:text-[#ae49fd] transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[10px] font-medium">{imageFiles.length}/{MAX_IMAGES}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6]">
        <div className="max-w-xl lg:mx-auto">
          <button
            onClick={submit}
            disabled={!isValid || saving}
            className="w-full py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity active:scale-[0.98]"
          >
            {saving ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
