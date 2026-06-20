import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/src/style.css";
import { SERVICE_CATEGORIES, AI_TOOLS_OPTIONS, ALL_TECH_TAGS } from "./ProductScreen";
import type { ServiceCategory } from "./ProductScreen";
import { PRODUCT_TYPES } from "../api/product";
import type { ProductType } from "../api/product";
import { supabase } from "../lib/supabase";
import { createShowcase } from "../api/product";
import { useUser } from "../contexts/userContextValue";
import { useToast } from "../components/toastContext";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full lg:w-[360px] lg:rounded-2xl rounded-t-2xl shadow-xl animate-slide-up lg:animate-none max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 lg:pt-5 shrink-0">
          <div className="lg:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
          <p className="text-[16px] font-semibold text-gray-900">{title}</p>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-5 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function InlineCalendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;
  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  }
  return (
    <div className="bg-gray-50 rounded-2xl flex justify-center rdp-wrapper"
      style={{ "--rdp-accent-color": "#ae49fd", "--rdp-accent-background-color": "#f4e5ff" } as React.CSSProperties}
    >
      <DayPicker mode="single" selected={selected} onSelect={handleSelect} locale={ko} navLayout="around" />
    </div>
  );
}

function formatLaunchDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-[14px] font-semibold text-[#364153]">
          {label}
          {required && <span className="text-[#ae49fd] ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[12px] font-medium text-[#99a1af]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function ShowcaseNewScreen() {
  const navigate = useNavigate();
  const { session } = useUser();
  const { toast } = useToast();
  const iconInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [snsUrl, setSnsUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">("");
  const [productType, setProductType] = useState<ProductType>("웹");
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);
  const [launchDate, setLaunchDate] = useState("");
  const [datepickerOpen, setDatepickerOpen] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleIconSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { setError("이미지 크기는 5MB 이하여야 해요"); return; }
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setError(null);
  }

  function removeIcon() {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconFile(null);
    setIconPreview(null);
    if (iconInputRef.current) iconInputRef.current.value = "";
  }

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { setError("이미지 크기는 5MB 이하여야 해요"); return; }
    if (galleryFiles.length >= 5) return;
    setGalleryFiles((prev) => [...prev, file]);
    setGalleryPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    setError(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function removeGallery(index: number) {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  const shortDescError = shortDescription.length > 50 ? "50자 이내로 입력해주세요" : null;
  const detailDescError = detailDescription.length > 300 ? "300자 이내로 입력해주세요" : null;

  const canSubmit =
    title.trim().length > 0 &&
    shortDescription.trim().length > 0 &&
    serviceCategory !== "" &&
    !shortDescError &&
    !detailDescError;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const val = customTagInput.trim();
    if (!val || selectedTags.includes(val)) { setCustomTagInput(""); return; }
    setSelectedTags((prev) => [...prev, val]);
    setCustomTagInput("");
  }

  function toggleAiTool(tool: string) {
    setSelectedAiTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleSubmit() {
    if (!canSubmit || !session) return;
    setLoading(true);
    setError(null);

    try {
      if (!session) throw new Error("로그인이 필요해요");

      async function uploadImage(file: File, prefix: string): Promise<string> {
        const ext = file.name.split(".").pop();
        const path = `${session!.user.id}/${prefix}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }

      const iconUrl = iconFile ? await uploadImage(iconFile, "icon") : undefined;
      const galleryUrls = await Promise.all(
        galleryFiles.map((f, i) => uploadImage(f, `gallery-${i}-${Date.now()}`))
      );

      const id = await createShowcase({
        userId: session.user.id,
        title,
        shortDescription,
        detailDescription: detailDescription || undefined,
        iconUrl,
        galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined,
        serviceUrl: serviceUrl || undefined,
        snsUrl: snsUrl || undefined,
        tags: selectedTags,
        serviceCategory: serviceCategory as ServiceCategory,
        productType,
        aiTools: selectedAiTools,
        launchDate: launchDate || undefined,
      });
      navigate(`/product/${id}`, { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "등록 중 오류가 발생했어요";
      setError(msg);
      toast(msg);
    } finally {
      setLoading(false);
    }
  }

  const isDirty = !!(title.trim() || shortDescription.trim());
  const blocker = useUnsavedChanges(isDirty && !loading);

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
          {/* 헤더 */}
          <div className="mb-9">
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">프로젝트 등록</h1>
            <p className="text-[14px] text-[#99a1af] mt-1">바이브코더들에게 프로젝트를 소개해요</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-[14px] text-red-500">
              {error}
            </div>
          )}

          {/* 필드 영역 */}
          <div className="flex flex-col gap-5">
            {/* 앱 아이콘 */}
            <Field label="앱 아이콘">
              <input ref={iconInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleIconSelect} />
              {iconPreview ? (
                <div className="relative w-[80px] h-[80px]">
                  <img src={iconPreview} alt="아이콘" className="w-full h-full object-cover rounded-[18px]" />
                  <button
                    type="button"
                    onClick={removeIcon}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#101828] rounded-full flex items-center justify-center"
                  >
                    <img src="/icons/X.svg" width={10} height={10} className="brightness-0 invert" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="w-[80px] h-[80px] flex flex-col items-center justify-center gap-1.5 bg-[#f9fafb] rounded-[18px] text-[#99a1af] hover:bg-[#f3f4f6] transition-colors"
                >
                  <img src="/icons/plus.svg" width={20} height={20} />
                  <span className="text-[11px] font-medium">아이콘</span>
                </button>
              )}
            </Field>

            {/* 갤러리 이미지 */}
            <Field label="갤러리 이미지" hint="최대 5장 · 16:9 권장">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGallerySelect}
              />
              <div className="flex flex-wrap gap-2">
                {galleryPreviews.map((preview, i) => (
                  <div key={i} className="relative rounded-[12px] overflow-hidden shrink-0" style={{ width: 130, height: 73 }}>
                    <img src={preview} alt={`갤러리 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGallery(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-[#101828]/70 rounded-full flex items-center justify-center"
                    >
                      <img src="/icons/X.svg" width={8} height={8} className="brightness-0 invert" />
                    </button>
                  </div>
                ))}
                {galleryPreviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 bg-[#f9fafb] rounded-[12px] text-[#99a1af] hover:bg-[#f3f4f6] transition-colors shrink-0"
                    style={{ width: 130, height: 73 }}
                  >
                    <img src="/icons/plus.svg" width={16} height={16} />
                    <span className="text-[11px] font-medium">{galleryPreviews.length}/5</span>
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[12px] text-[#99a1af] tracking-[-0.32px]">
                16:9 비율로 업로드하면 가장 예쁘게 보여요 (예: 1920×1080)
              </p>
            </Field>

            {/* 서비스명 */}
            <Field label="서비스명" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="서비스 이름을 입력하세요"
                maxLength={40}
                className="input"
              />
            </Field>

            {/* 한줄 설명 */}
            <Field label="한줄 설명" required hint="카드에 표시돼요">
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="서비스를 한 문장으로 소개해주세요"
                maxLength={60}
                className="input"
              />
              <div className="flex justify-between mt-1.5">
                {shortDescError
                  ? <p className="text-[12px] text-red-500">{shortDescError}</p>
                  : <span />
                }
                <p className="text-right text-[12px] text-[#99a1af]">{shortDescription.length}/50</p>
              </div>
            </Field>

            {/* 추가 설명 */}
            <Field label="추가 설명" hint="선택사항">
              <textarea
                value={detailDescription}
                onChange={(e) => {
                  setDetailDescription(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="서비스를 더 자세히 소개해주세요"
                maxLength={320}
                className="input resize-none min-h-[120px] leading-relaxed overflow-hidden"
              />
              <div className="flex justify-between mt-1.5">
                {detailDescError
                  ? <p className="text-[12px] text-red-500">{detailDescError}</p>
                  : <span />
                }
                <p className="text-right text-[12px] text-[#99a1af]">{detailDescription.length}/300</p>
              </div>
            </Field>

            {/* 프로덕트 종류 */}
            <Field label="프로덕트 종류" required>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProductType(type)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      productType === type
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

            {/* 서비스 분야 */}
            <Field label="서비스 분야" required>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setServiceCategory(cat)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      serviceCategory === cat
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

            {/* 기술 스택 */}
            <Field label="기술 스택" hint="복수 선택 가능">
              <div className="flex flex-wrap gap-2">
                {ALL_TECH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.filter((t) => !(ALL_TECH_TAGS as readonly string[]).includes(t)).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-4 py-[10px] rounded-[12px] text-[14px] font-semibold bg-[#f4e5ff] text-[#ae49fd]">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
                  onBlur={addCustomTag}
                  placeholder="+ 직접 입력"
                  className="px-4 py-[10px] rounded-[12px] text-[14px] bg-[#f1f3f7] text-[#101828] placeholder:text-[#b0b8c1] outline-none w-28"
                />
              </div>
            </Field>

            {/* 사용한 AI 툴 */}
            <Field label="사용한 AI 툴" hint="복수 선택 가능">
              <div className="flex flex-wrap gap-2">
                {AI_TOOLS_OPTIONS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleAiTool(tool)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      selectedAiTools.includes(tool)
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </Field>

            {/* 서비스 링크 */}
            <Field label="서비스 링크">
              <input
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://yourservice.com"
                className="input"
              />
            </Field>

            {/* 홍보 SNS */}
            <Field label="홍보 SNS">
              <input
                type="url"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="input"
              />
            </Field>

            {/* 출시 날짜 */}
            <Field label="출시 날짜">
              <button
                type="button"
                onClick={() => setDatepickerOpen(true)}
                className={`w-full flex items-center justify-between px-[14px] py-[12px] rounded-[12px] bg-[#f9fafb] text-[14px] outline-none transition-colors ${launchDate ? "text-[#101828]" : "text-[#99a1af]"}`}
              >
                <span>{launchDate ? formatLaunchDate(launchDate) : "출시 날짜 선택"}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#99a1af]">
                  <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </Field>
          </div>
        </div>
      </div>

      {datepickerOpen && (
        <PickerSheet title="출시 날짜 선택" onClose={() => setDatepickerOpen(false)}>
          <InlineCalendar
            value={launchDate}
            onChange={(v) => { setLaunchDate(v); setDatepickerOpen(false); }}
          />
        </PickerSheet>
      )}

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6]">
        <div className="max-w-xl lg:mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity active:scale-[0.98]"
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
