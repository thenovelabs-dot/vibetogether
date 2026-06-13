export function ConfirmModal({
  title,
  message,
  confirmLabel = "삭제",
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full max-w-[320px] rounded-[20px] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <h2 className="text-[16px] font-bold text-[#101828] tracking-[-0.32px] mb-2">{title}</h2>
          <p className="text-[14px] text-[#6a7282] tracking-[-0.32px] leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-[#f3f4f6]">
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-[14px] font-semibold text-[#6a7282] border-r border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-4 text-[14px] font-semibold text-[#ef4444] hover:bg-[#fef2f2] transition-colors disabled:opacity-40"
          >
            {loading ? `${confirmLabel} 중...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
