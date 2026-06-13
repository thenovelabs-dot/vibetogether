import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMeetupById, updateMeetup } from "../api/meetups";
import { useToast } from "../components/Toast";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { ConfirmModal } from "../components/ConfirmModal";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-[14px] font-semibold text-[#364153]">
          {label}
          {required && <span className="text-[#ae49fd] ml-0.5">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
}

export default function MeetupEditScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    place_name: "",
    date: "",
    time: "",
    capacity: "6",
  });

  useEffect(() => {
    if (!id) return;
    getMeetupById(id)
      .then((m) => {
        if (!m) return;
        const dt = new Date(m.start_at);
        const date = m.start_at
          ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
          : "";
        const time = m.start_at
          ? `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`
          : "";
        setForm({
          title: m.title,
          description: m.description ?? "",
          place_name: m.place_name,
          date,
          time,
          capacity: String(m.capacity),
        });
        setTimeout(() => {
          const el = descRef.current;
          if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
        }, 0);
      })
      .catch(() => toast("모임 정보를 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!id || !form.title.trim()) return;
    setSaving(true);
    try {
      const startAt =
        form.date && form.time
          ? new Date(`${form.date}T${form.time}:00`).toISOString()
          : form.date
            ? new Date(`${form.date}T09:00:00`).toISOString()
            : undefined;
      await updateMeetup(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        placeName: form.place_name.trim() || undefined,
        startAt,
        capacity: Number(form.capacity),
      });
      toast("수정됐어요", "success");
      navigate(`/meetup/${id}`);
    } catch {
      toast("저장에 실패했어요. 다시 시도해주세요");
    } finally {
      setSaving(false);
    }
  }

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
            <h1 className="text-[20px] font-bold text-[#101828] leading-[28px]">모임 수정</h1>
          </div>

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

            <Field label="장소">
              <input
                value={form.place_name}
                onChange={(e) => update("place_name", e.target.value)}
                placeholder="예: 커피빈 강남점"
                className="input"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="날짜">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="input w-full"
                />
              </Field>
              <Field label="시간">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  className="input w-full"
                />
              </Field>
            </div>

            <Field label="모집인원">
              <div className="flex gap-3">
                {(["2", "3", "4", "5", "6"] as const).map((n) => (
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
                    {n === "6" ? "+6명" : `${n}명`}
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

      <div className="px-4 lg:px-8 pt-[17px] pb-8 border-t border-[#f3f4f6] flex gap-3">
        <div className="max-w-xl lg:mx-auto flex gap-3 w-full">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-[16px] bg-[#f1f3f7] text-[#6a7282] text-[14px] font-bold rounded-[16px] hover:bg-[#e9eaec] transition-colors"
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-[16px] bg-[#ae49fd] text-white text-[16px] font-bold rounded-[16px] disabled:opacity-40 transition-opacity"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
