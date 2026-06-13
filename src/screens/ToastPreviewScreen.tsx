export default function ToastPreviewScreen() {
  const toasts = [
    { type: "error", message: "저장에 실패했어요. 다시 시도해주세요", bg: "bg-[#ef4444]" },
    { type: "success", message: "저장됐어요", bg: "bg-[#22c55e]" },
    { type: "info", message: "링크가 복사됐어요", bg: "bg-[#101828]" },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfb] flex items-center justify-center px-4">
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.type}
            className={`px-5 py-3 rounded-[14px] shadow-lg text-white text-[14px] font-semibold tracking-[-0.32px] w-full text-center ${t.bg}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
