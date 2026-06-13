import { useState } from "react";
import { ALL_REGIONS, REGIONS_BY_CITY } from "../lib/regions";

interface RegionPickerProps {
  value: string;
  onChange: (region: string) => void;
}

export function RegionPicker({ value, onChange }: RegionPickerProps) {
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? ALL_REGIONS.filter((r) => r.name.includes(query.trim()) || r.city.includes(query.trim()))
    : [];

  function pick(name: string) {
    onChange(name);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#99a1af] tracking-[-0.32px]">선택됨</span>
          <span className="h-[23px] px-[7px] py-[3px] bg-[#101828] text-white rounded-full text-[12px] font-medium tracking-[-0.32px]">
            {value}
          </span>
        </div>
      )}

      <div className={`flex items-center gap-2 px-[14px] py-[14px] rounded-[12px] transition-colors ${query ? "bg-[#fbf6ff]" : "bg-[#f9fafb]"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#99a1af]">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="지역 검색 (예: 강남, 해운대)"
          className="flex-1 bg-transparent outline-none text-[14px] text-[#101828] placeholder:text-[#99a1af] tracking-[-0.32px]"
        />
      </div>

      <div className="max-h-52 overflow-y-auto">
        {query.trim() ? (
          results.length === 0 ? (
            <p className="text-[14px] text-[#99a1af] text-center py-4">검색 결과 없음</p>
          ) : (
            <div className="flex flex-wrap gap-[4px] p-3">
              {results.map((r) => (
                <button
                  key={`${r.city}-${r.name}`}
                  type="button"
                  onClick={() => pick(r.name)}
                  className={`h-[23px] px-[7px] py-[3px] rounded-full text-[12px] font-medium tracking-[-0.32px] transition-colors ${
                    value === r.name ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f] hover:bg-[#e9eaec]"
                  }`}
                >
                  {r.name}
                  <span className="text-[10px] opacity-60 ml-1">{r.city}</span>
                </button>
              ))}
            </div>
          )
        ) : (
          <div>
            {Object.entries(REGIONS_BY_CITY).map(([city, regions]) => (
              <div key={city} className="px-[12px] pt-[8px] pb-[12px] border-b border-[#f9fafb] last:border-0">
                <p className="text-[12px] font-medium text-[#99a1af] mb-[6px] tracking-[-0.32px]">{city}</p>
                <div className="flex flex-wrap gap-[4px]">
                  {regions.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onChange(r)}
                      className={`h-[23px] px-[7px] py-[3px] rounded-full text-[12px] font-medium tracking-[-0.32px] transition-colors ${
                        value === r ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f] hover:bg-[#e9eaec]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
