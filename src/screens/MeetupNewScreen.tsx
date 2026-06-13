import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/src/style.css";
import { useUser } from "../contexts/UserContext";
import { createMeetup } from "../api/meetups";
import { useToast } from "../components/Toast";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";
import { RegionPicker } from "../components/RegionPicker";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

function PickerSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full lg:w-[360px] lg:rounded-2xl rounded-t-2xl shadow-xl
                   animate-slide-up lg:animate-none max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 (모바일) / 헤더 */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 lg:pt-5 shrink-0">
          <div className="lg:hidden absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />
          <p className="text-[16px] font-semibold text-gray-900">{title}</p>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="px-5 pb-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function InlineCalendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
  }

  return (
    <div
      className="bg-gray-50 rounded-2xl flex justify-center rdp-wrapper"
      style={{
        "--rdp-accent-color": "#3182F6",
        "--rdp-accent-background-color": "#EEF4FF",
        "--rdp-day-height": "38px",
        "--rdp-day-width": "38px",
        "--rdp-day_button-height": "36px",
        "--rdp-day_button-width": "36px",
      } as React.CSSProperties}
    >
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={handleSelect}
        disabled={{ before: today }}
        locale={ko}
        navLayout="around"
      />
    </div>
  );
}

export default function MeetupNewScreen() {
  const navigate = useNavigate();
  const { profile, session } = useUser();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    place_name: "",
    date: "",
    time: "",
    capacity: "6",
    region: profile?.region ?? "",
  });
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [datepickerOpen, setDatepickerOpen] = useState(false);
  const [timepickerOpen, setTimepickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = !!(form.title.trim() || form.description.trim() || form.place_name.trim());
  const blocker = useUnsavedChanges(isDirty && !saving);
  const isValid = form.title.trim() && form.region;

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!session || !isValid || saving) return;
    setSaving(true);
    try {
      const startAt = form.date
        ? new Date(`${form.date}T${form.time || "09:00"}:00`).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const id = await createMeetup({
        hostId: session.user.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        placeName: form.place_name.trim(),
        startAt,
        capacity: Number(form.capacity),
        region: form.region,
      });
      navigate(`/meetup/${id}`, { replace: true });
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
          {/* 헤더 */}
          <div className="mb-9">
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">모임 등록</h1>
            <p className="text-[14px] text-[#99a1af] mt-1">같이 작업할 모임을 만들어요</p>
          </div>

          {/* 필드 영역 */}
          <div className="flex flex-col gap-5">
            <Field label="모임 제목" required>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="예: 강남역 조용한 카페 모각작"
                maxLength={40}
                className="input"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="지역" required className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setRegionModalOpen(true)}
                  className={`w-full text-left flex items-center justify-between px-[14px] py-[12px] rounded-[12px] bg-[#f9fafb] focus:bg-[#fbf6ff] text-[14px] outline-none transition-colors ${
                    form.region ? "text-[#101828]" : "text-[#99a1af]"
                  }`}
                >
                  <span className="truncate">{form.region || "지역 선택"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 ml-1 text-[#99a1af]">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </Field>
              <Field label="장소" hint="미정이면 비워두세요" className="flex-1 min-w-0">
                <input
                  value={form.place_name}
                  onChange={(e) => update("place_name", e.target.value)}
                  placeholder="예: 커피빈 강남점"
                  className="input"
                />
              </Field>
            </div>

            <div className="flex gap-3">
              <Field label="날짜" hint="미정이면 비워두세요" className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setDatepickerOpen(true)}
                  className={`w-full flex items-center justify-between px-[14px] py-[12px] rounded-[12px] bg-[#f9fafb] focus:bg-[#fbf6ff] text-[14px] outline-none transition-colors ${form.date ? "text-[#101828]" : "text-[#99a1af]"}`}
                >
                  <span>{form.date ? formatDate(form.date) : "날짜 선택"}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#99a1af]">
                    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </Field>
              <Field label="시간" hint="미정이면 비워두세요" className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setTimepickerOpen(true)}
                  className={`w-full flex items-center justify-between px-[14px] py-[12px] rounded-[12px] bg-[#f9fafb] focus:bg-[#fbf6ff] text-[14px] outline-none transition-colors ${form.time ? "text-[#101828]" : "text-[#99a1af]"}`}
                >
                  <span>{form.time || "시간 선택"}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#99a1af]">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </Field>
            </div>

            <Field label="모집인원">
              <div className="flex gap-3">
                {[
                  { value: "2", label: "2명" },
                  { value: "3", label: "3명" },
                  { value: "4", label: "4명" },
                  { value: "5", label: "5명" },
                  { value: "6", label: "+6명" },
                ].map(({ value: n, label }) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => update("capacity", n)}
                    className={`flex-1 py-[12px] rounded-[12px] text-[14px] font-semibold transition-colors ${
                      form.capacity === n
                        ? "bg-[#f4e5ff] text-[#ae49fd]"
                        : "bg-[#f1f3f7] text-[#898f98]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="설명">
              <textarea
                ref={descRef}
                value={form.description}
                onChange={(e) => {
                  update("description", e.target.value);
                  const el = descRef.current;
                  if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
                }}
                placeholder="모임에 대해 자유롭게 적어주세요"
                maxLength={200}
                rows={5}
                className="input resize-none overflow-hidden"
              />
            </Field>
          </div>
        </div>
      </div>

      {datepickerOpen && (
        <PickerSheet title="날짜 선택" onClose={() => setDatepickerOpen(false)}>
          <InlineCalendar value={form.date} onChange={(v) => { update("date", v); setDatepickerOpen(false); }} />
        </PickerSheet>
      )}
      {timepickerOpen && (
        <PickerSheet title="시간 선택" onClose={() => setTimepickerOpen(false)}>
          <div className="h-56 flex flex-col">
            <InlineTimePicker value={form.time} onChange={(v) => update("time", v)} />
          </div>
          <button
            type="button"
            onClick={() => setTimepickerOpen(false)}
            className="mt-4 w-full py-3 bg-[#ae49fd] text-white text-[14px] font-semibold rounded-xl"
          >
            확인
          </button>
        </PickerSheet>
      )}

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6]">
        <div className="max-w-xl lg:mx-auto">
          <button
            onClick={submit}
            disabled={!isValid || saving}
            className="w-full py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity active:scale-[0.98]"
          >
            {saving ? "등록 중..." : "모임 등록하기"}
          </button>
        </div>
      </div>

      {regionModalOpen && (
        <RegionPickerModal
          current={form.region}
          onSelect={(r) => { update("region", r); setRegionModalOpen(false); }}
          onClose={() => setRegionModalOpen(false)}
        />
      )}
    </div>
  );
}

const HOURS = Array.from({ length: 15 }, (_, i) => String(i + 8).padStart(2, "0")); // 08~22
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const ITEM_H = 44;

function WheelPicker({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const settling = useRef(false);
  const [padding, setPadding] = useState(ITEM_H * 2);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      setPadding(Math.max(0, (h - ITEM_H) / 2));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const idx = items.indexOf(value);
    if (scrollRef.current && idx >= 0) {
      scrollRef.current.scrollTop = idx * ITEM_H;
    }
  }, [padding]); // eslint-disable-line react-hooks/exhaustive-deps

  function onScroll() {
    if (settling.current) return;
    settling.current = true;
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const idx = Math.round(scrollRef.current.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(idx, items.length - 1));
        if (items[clamped] !== value) onChange(items[clamped]);
      }
      settling.current = false;
    });
  }

  return (
    <div ref={containerRef} className="relative flex-1 self-stretch">
      {/* 선택 영역 하이라이트 */}
      <div
        className="absolute inset-x-2 bg-gray-100 rounded-xl pointer-events-none z-10"
        style={{ top: padding, height: ITEM_H }}
      />
      {/* 스크롤 텍스트 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="no-scrollbar h-full overflow-y-scroll absolute inset-0 z-20"
        style={{ scrollSnapType: "y mandatory" }}
      >
        <div style={{ height: padding }} />
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-center justify-center font-semibold transition-colors ${
              item === value ? "text-gray-900 text-[20px]" : "text-gray-300 text-[18px]"
            }`}
            style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: padding }} />
      </div>
      {/* 위아래 그라데이션 */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent pointer-events-none z-30" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-30" />
    </div>
  );
}

function InlineTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hour, minute] = value ? value.split(":") : (() => {
    const now = new Date();
    const h = String(Math.min(Math.max(now.getHours(), 8), 22)).padStart(2, "0");
    const m = String(Math.round(now.getMinutes() / 5) * 5 % 60).padStart(2, "0");
    return [h, m];
  })();

  return (
    <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex flex-1">
        <WheelPicker items={HOURS} value={hour} onChange={(h) => onChange(`${h}:${minute}`)} />
        <span className="text-[22px] font-bold text-gray-300 self-center pb-0.5">:</span>
        <WheelPicker items={MINUTES} value={minute} onChange={(m) => onChange(`${hour}:${m}`)} />
      </div>
    </div>
  );
}

function RegionPickerModal({ current, onSelect, onClose }: {
  current: string;
  onSelect: (r: string) => void;
  onClose: () => void;
}) {
  const { profile } = useUser();
  const profileRegion = profile?.region ?? "";
  const [selected, setSelected] = useState(current || profileRegion);

  return (
    <PickerSheet title="지역 선택" onClose={onClose}>
      {profileRegion && (
        <div className="mb-4">
          <p className="text-[12px] text-[#99a1af] mb-2 tracking-[-0.32px]">내 설정 지역</p>
          <button
            type="button"
            onClick={() => setSelected(profileRegion)}
            className={`h-[23px] px-[7px] py-[3px] rounded-full text-[12px] font-medium tracking-[-0.32px] transition-colors ${
              selected === profileRegion ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f] hover:bg-[#e9eaec]"
            }`}
          >
            {profileRegion}
          </button>
        </div>
      )}

      <RegionPicker value={selected} onChange={setSelected} />

      <button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected}
        className="w-full mt-4 py-3 bg-[#ae49fd] text-white text-[14px] font-semibold rounded-xl disabled:opacity-40 transition-opacity"
      >
        선택 완료
      </button>
    </PickerSheet>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2 mb-1.5">
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
