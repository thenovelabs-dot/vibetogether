import { useToast } from "../components/toastContext";

export default function ToastPreviewScreen() {
  const { toast } = useToast();

  const samples = [
    { label: "저장 실패 (error)", message: "저장에 실패했어요. 다시 시도해주세요", type: "error" as const },
    { label: "저장 성공 (success)", message: "저장됐어요", type: "success" as const },
    { label: "링크 복사 (info)", message: "링크가 복사됐어요", type: "info" as const },
    { label: "신고 접수 (report)", message: "신고가 접수됐어요", type: "report" as const },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfb] flex items-center justify-center px-4">
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {samples.map((s) => (
          <button
            key={s.type}
            onClick={() => toast(s.message, s.type)}
            className="px-4 py-3 rounded-[12px] bg-white border border-[#e9eaec] text-[14px] text-[#364153] font-medium text-left"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
