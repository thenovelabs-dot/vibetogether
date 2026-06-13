import { useState, useRef, useEffect } from "react";

type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export function DotsMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#f5f6f7] hover:bg-[#e9eaec] transition-colors"
      >
        <img src="/icons/dots-vertical.svg" width={16} height={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-[#f3f4f6] z-50 overflow-hidden min-w-[120px]">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setOpen(false); }}
              className={`w-full px-4 py-[11px] text-left text-[14px] font-semibold tracking-[-0.32px] hover:bg-[#f9fafb] transition-colors ${
                item.danger ? "text-red-500" : "text-[#364153]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
