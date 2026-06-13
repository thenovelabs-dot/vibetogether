import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getShowcaseById, updateShowcase } from "../api/product";
import { useToast } from "../components/Toast";
import { supabase } from "../lib/supabase";
import { useUser } from "../contexts/UserContext";
import { SERVICE_CATEGORIES, AI_TOOLS_OPTIONS, ALL_TECH_TAGS } from "./ProductScreen";
import type { ServiceCategory } from "./ProductScreen";
import { PRODUCT_TYPES } from "../api/product";
import type { ProductType } from "../api/product";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";

type TechTag = (typeof ALL_TECH_TAGS)[number];

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function ShowcaseEditScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useUser();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const detailRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (detailRef.current) {
      detailRef.current.style.height = "auto";
      detailRef.current.style.height = detailRef.current.scrollHeight + "px";
    }
  }, [detailDescription]);
  const [serviceUrl, setServiceUrl] = useState("");
  const [snsUrl, setSnsUrl] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory | "">("");
  const [productType, setProductType] = useState<ProductType>("웹");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    getShowcaseById(id)
      .then((item) => {
        if (!item) return;
        setTitle(item.title);
        setShortDescription(item.short_description);
        setDetailDescription(item.detail_description ?? "");
        setServiceUrl(item.service_url ?? "");
        setSnsUrl(item.sns_url ?? "");
        setLaunchDate(item.launch_date ?? "");
        setServiceCategory((item.service_category as ServiceCategory) ?? "");
        setProductType((item.product_type as ProductType) ?? "웹");
        setSelectedTags(item.tags ?? []);
        setSelectedAiTools(item.ai_tools ?? []);
        setExistingGalleryUrls(item.gallery_urls ?? []);
      })
      .catch(() => toast("프로젝트 정보를 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleGallerySelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const total = existingGalleryUrls.length + newGalleryFiles.length;
    if (file.size > MAX_IMAGE_SIZE) { toast("이미지 크기는 5MB 이하여야 해요"); return; }
    if (total >= 5) return;
    setNewGalleryFiles((prev) => [...prev, file]);
    setNewGalleryPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function removeExistingGallery(index: number) {
    setExistingGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewGallery(index: number) {
    URL.revokeObjectURL(newGalleryPreviews[index]);
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function addCustomTag() {
    const val = customTagInput.trim();
    if (!val || selectedTags.includes(val)) { setCustomTagInput(""); return; }
    setSelectedTags((prev) => [...prev, val]);
    setCustomTagInput("");
  }

  function toggleAiTool(tool: string) {
    setSelectedAiTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  }

  async function submit() {
    if (!id || !title.trim() || !shortDescription.trim() || !session) return;
    setSaving(true);
    try {
      const uploadedUrls = await Promise.all(
        newGalleryFiles.map(async (file, i) => {
          const ext = file.name.split(".").pop();
          const path = `${session.user.id}/gallery-${i}-${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
          if (error) throw error;
          return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        })
      );
      await updateShowcase(id, {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        detailDescription: detailDescription.trim(),
        serviceUrl: serviceUrl.trim(),
        snsUrl: snsUrl.trim(),
        tags: selectedTags,
        serviceCategory: serviceCategory || undefined,
        productType,
        aiTools: selectedAiTools,
        launchDate: launchDate,
        galleryUrls: [...existingGalleryUrls, ...uploadedUrls],
      });
      toast("수정됐어요", "success");
      navigate(`/product/${id}`);
    } catch {
      toast("저장에 실패했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  }

  const isValid = title.trim() && shortDescription.trim();

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
          <div className="mb-9">
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">프로젝트 수정</h1>
          </div>

          <div className="flex flex-col gap-5">
            <Field label="프로젝트 이름" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="프로젝트 이름을 입력하세요"
                maxLength={40}
                className="input"
              />
            </Field>

            <Field label="한줄 소개" required>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="어떤 서비스인지 한 문장으로 설명해주세요"
                maxLength={80}
                className="input"
              />
            </Field>

            <Field label="상세 설명" hint="선택">
              <textarea
                ref={detailRef}
                value={detailDescription}
                onChange={(e) => {
                  setDetailDescription(e.target.value);
                  const el = detailRef.current;
                  if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                }}
                placeholder="프로젝트에 대해 더 자세히 설명해주세요"
                maxLength={500}
                className="input resize-none min-h-[120px] leading-relaxed overflow-hidden"
              />
            </Field>

            <Field label="프로덕트 종류">
              <div className="flex flex-wrap gap-2">
                {PRODUCT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProductType(type)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      productType === type ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="카테고리">
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setServiceCategory(c)}
                    className={`px-4 py-[10px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      serviceCategory === c ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="사용 AI 툴" hint="선택">
              <div className="flex flex-wrap gap-2">
                {AI_TOOLS_OPTIONS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleAiTool(tool)}
                    className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors ${
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

            <Field label="기술 스택" hint="선택">
              <div className="flex flex-wrap gap-2">
                {ALL_TECH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.filter((t) => !(ALL_TECH_TAGS as readonly string[]).includes(t)).map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-semibold bg-[#f4e5ff] text-[#ae49fd]">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
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
                  className="px-3 py-1.5 rounded-xl text-[13px] bg-[#f1f3f7] text-[#101828] placeholder:text-[#b0b8c1] outline-none w-24"
                />
              </div>
            </Field>

            <Field label="서비스 URL" hint="선택">
              <input
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </Field>

            <Field label="SNS 링크" hint="선택">
              <input
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                placeholder="https://instagram.com/..."
                className="input"
              />
            </Field>

            <Field label="갤러리 이미지" hint="최대 5장">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGallerySelect}
              />
              <div className="flex flex-wrap gap-2">
                {existingGalleryUrls.map((url, i) => (
                  <div key={`ex-${i}`} className="relative rounded-[12px] overflow-hidden shrink-0" style={{ width: 130, height: 73 }}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingGallery(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-[#101828]/70 rounded-full flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ))}
                {newGalleryPreviews.map((preview, i) => (
                  <div key={`new-${i}`} className="relative rounded-[12px] overflow-hidden shrink-0" style={{ width: 130, height: 73 }}>
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewGallery(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-[#101828]/70 rounded-full flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ))}
                {existingGalleryUrls.length + newGalleryPreviews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 bg-[#f9fafb] rounded-[12px] text-[#99a1af] hover:bg-[#f3f4f6] transition-colors shrink-0"
                    style={{ width: 130, height: 73 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    <span className="text-[11px] font-medium">{existingGalleryUrls.length + newGalleryPreviews.length}/5</span>
                  </button>
                )}
              </div>
            </Field>

            <Field label="출시일" hint="선택">
              <input
                type="date"
                value={launchDate}
                onChange={(e) => setLaunchDate(e.target.value)}
                className="input"
              />
            </Field>
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
