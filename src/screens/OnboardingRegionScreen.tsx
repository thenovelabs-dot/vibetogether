import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getCurrentPosition, reverseGeocode } from "../lib/naverGeo";
import { createUser } from "../api/users";
import { regionKey, regionDisplay } from "../lib/regions";

const SEED_REGIONS: { label: string; key: string }[] = [
  { label: "강남",   key: regionKey("서울", "강남구") },
  { label: "서초",   key: regionKey("서울", "서초구") },
  { label: "성수",   key: regionKey("서울", "성동구") },
  { label: "판교",   key: regionKey("경기", "성남시") },
  { label: "홍대",   key: regionKey("서울", "마포구") },
  { label: "이태원", key: regionKey("서울", "용산구") },
];

export default function OnboardingRegionScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { session, refreshProfile } = useUser();
  const [selected, setSelected] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function onGeoLocate() {
    setGeoLoading(true);
    setGeoError("");
    try {
      const { latitude, longitude } = await getCurrentPosition();
      const regionName = await reverseGeocode(latitude, longitude);
      setCoords({ lat: latitude, lng: longitude });
      setSelected(regionName);
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "위치를 가져오지 못했어요");
    } finally {
      setGeoLoading(false);
    }
  }

  async function onComplete() {
    if (!session) return;
    setSaving(true);

    try {
      await createUser({
        id: session.user.id,
        nickname: state?.nickname,
        region: selected,
        lat: coords?.lat,
        lng: coords?.lng,
      });
    } catch {
      setSaving(false);
      return;
    }

    await refreshProfile();
    navigate("/meetup", { replace: true });
  }

  return (
    <div className="flex flex-col h-screen bg-white px-5 lg:px-[120px]">
      <div className="w-full flex flex-col h-full">
        <div className="flex-1 flex flex-col justify-start pt-16">
          <h1 className="text-[20px] font-bold text-[#101828] mb-2">동네를 설정해주세요</h1>
          <p className="text-[14px] text-[#99a1af] mb-8">
            주변 모임을 찾을 때 기준이 돼요
          </p>

          <button
            onClick={onGeoLocate}
            disabled={geoLoading}
            className="w-full flex items-center gap-3 px-[14px] py-[14px] rounded-xl border border-[#ae49fd] text-[#ae49fd] font-semibold text-[14px] mb-1 active:bg-[#fbf6ff] disabled:opacity-50 transition-opacity"
          >
            <span>📍</span>
            {geoLoading ? "위치 불러오는 중..." : selected ? `현재 위치: ${regionDisplay(selected)}` : "현재 위치로 자동 설정"}
          </button>
          {geoError && <p className="mb-3 text-[12px] text-red-500">{geoError}</p>}
          {!geoError && <div className="mb-3" />}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f3f4f6]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-[#99a1af]">또는 직접 선택</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SEED_REGIONS.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                  selected === key
                    ? "bg-[#f4e5ff] text-[#ae49fd]"
                    : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-8 safe-bottom">
          <button
            onClick={onComplete}
            disabled={!selected || saving}
            className="w-full py-4 bg-[#ae49fd] text-white text-[16px] font-bold rounded-2xl disabled:opacity-40 transition-opacity"
          >
            {saving ? "저장 중..." : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
