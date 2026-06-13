import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getCurrentPosition, reverseGeocode } from "../lib/naverGeo";
import { isNicknameAvailable, createUser } from "../api/users";
import { RegionPicker } from "../components/RegionPicker";

const ADJS = ["새벽코딩", "커피충전", "집중하는", "열정넘치는", "조용한", "밤샘하는", "느긋한", "바쁜척하는", "진지한", "설레는"];
const NOUNS = ["수달", "개발자", "빌더", "메이커", "해커", "코더", "디자이너", "기획자", "엔지니어", "창업가"];

function generateNickname() {
  const adj = ADJS[Math.floor(Math.random() * ADJS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return adj + noun;
}

export default function OnboardingNicknameScreen() {
  const navigate = useNavigate();
  const { session, refreshProfile } = useUser();
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [region, setRegion] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [regionError, setRegionError] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);

  function validateNickname(value: string) {
    if (value.length === 0) return "";
    if (value.length < 2) return "2자 이상 입력해주세요";
    if (value.length > 12) return "12자 이내로 입력해주세요";
    if (/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9_]/.test(value)) return "특수문자는 사용할 수 없어요";
    return "";
  }

  function onNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNickname(val);
    setNicknameError(validateNickname(val));
  }

  function onGenerate() {
    const generated = generateNickname();
    setNickname(generated);
    setNicknameError(validateNickname(generated));
  }

  async function onGeoLocate() {
    setGeoLoading(true);
    setGeoError("");
    try {
      const { latitude, longitude } = await getCurrentPosition();
      setCoords({ lat: latitude, lng: longitude });
      try {
        const regionName = await reverseGeocode(latitude, longitude);
        setRegion(regionName);
        setShowSearch(false);
      } catch {
        setGeoError("위치 확인 실패. 직접 검색을 이용해주세요.");
        setShowSearch(true);
      }
    } catch (err) {
      setGeoError(err instanceof Error ? err.message : "위치를 가져오지 못했어요");
    } finally {
      setGeoLoading(false);
    }
  }

  async function onComplete() {
    if (!session) return;

    const nicknameErr = validateNickname(nickname);
    if (nicknameErr || nickname.trim().length < 2) {
      setNicknameError(nicknameErr || "2자 이상 입력해주세요");
      return;
    }
    if (!region) {
      setRegionError("동네를 선택해주세요");
      return;
    }

    setSaving(true);
    setRegionError("");

    const available = await isNicknameAvailable(nickname);
    if (!available) {
      setNicknameError("이미 사용 중인 닉네임이에요");
      setSaving(false);
      return;
    }

    try {
      await createUser({
        id: session.user.id,
        nickname,
        region,
        email: session.user.email ?? null,
        lat: coords?.lat,
        lng: coords?.lng,
      });
    } catch {
      setSaving(false);
      return;
    }

    await refreshProfile();
    navigate("/onboarding/aitools", { replace: true });
  }

  const isValid = nickname.trim().length >= 2 && !nicknameError && !!region;

  return (
    <div className="flex h-screen">
      {/* 좌측 브랜드 패널 (데스크탑) */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-[#ae49fd]" style={{ width: "45%" }}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-8">💻</div>
        <h1 className="text-[36px] font-bold text-white mb-3">같이바코할사람</h1>
        <p className="text-[18px] text-white/70 leading-relaxed mb-10">
          동네에서 바이브코딩 모임을<br />열고 참여하는 서비스
        </p>
        <div className="space-y-3">
          <Feature text="내 동네 기반으로 모임 찾기" />
          <Feature text="함께하면 더 집중되는 작업 시간" />
          <Feature text="같은 관심사를 가진 사람들과 교류" />
        </div>
      </div>

      {/* 우측 폼 */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-6 py-12 lg:py-16 flex flex-col flex-1">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-1.5 mb-10">
            <div className="h-1 rounded-full bg-[#ae49fd] flex-1" />
            <div className="h-1 rounded-full bg-[#f1f3f7] flex-1" />
            <div className="h-1 rounded-full bg-[#f1f3f7] flex-1" />
          </div>

          <h2 className="text-[20px] font-bold text-[#101828] mb-1">프로필 설정</h2>
          <p className="text-[14px] text-[#99a1af] mb-10">모임에서 사용할 닉네임과 동네를 알려주세요</p>

          {/* 닉네임 */}
          <p className="text-[14px] font-semibold text-[#364153] mb-2">닉네임</p>
          <div className="relative mb-1">
            <input
              value={nickname}
              onChange={onNicknameChange}
              placeholder="닉네임 입력 (2~12자)"
              maxLength={12}
              className={`w-full px-[14px] py-[14px] pr-12 rounded-xl text-[14px] outline-none transition-colors ${
                nicknameError
                  ? "bg-red-50"
                  : nickname
                  ? "bg-[#fbf6ff]"
                  : "bg-[#f9fafb]"
              }`}
            />
            <button
              onClick={onGenerate}
              title="자동 생성"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-[#99a1af] hover:text-[#ae49fd] hover:bg-white/60 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12a8 8 0 018-8 8 8 0 016.928 4M20 12a8 8 0 01-8 8 8 8 0 01-6.928-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 4l2 4h-4M6 20l-2-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {nicknameError
            ? <p className="mb-8 text-[12px] text-red-500">{nicknameError}</p>
            : <div className="mb-8" />
          }

          {/* 동네 */}
          <p className="text-[14px] font-semibold text-[#364153] mb-2">동네</p>
          <button
            onClick={onGeoLocate}
            disabled={geoLoading}
            className={`w-full flex items-center justify-between px-[14px] py-[14px] rounded-xl text-[14px] font-semibold mb-2 disabled:opacity-50 transition-colors ${
              region && coords ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f9fafb] text-[#6a7282] hover:bg-[#f3f4f6]"
            }`}
          >
            <span className="flex items-center gap-3">
              <img src={region && coords ? "/icons/location_purple.svg" : "/icons/location.svg"} width={16} height={16} />
              {geoLoading ? "위치 불러오는 중..." : region && coords ? region : "현재 위치로 자동 설정"}
            </span>
            {region && coords && !geoLoading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-60">
                <path d="M4 12a8 8 0 018-8 8 8 0 016.928 4M20 12a8 8 0 01-8 8 8 8 0 01-6.928-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 4l2 4h-4M6 20l-2-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          {geoError && <p className="mb-2 text-[12px] text-[#99a1af]">{geoError}</p>}
          {regionError && <p className="mb-2 text-[12px] text-red-500">{regionError}</p>}

          {!showSearch && (
            <button
              onClick={() => setShowSearch(true)}
              className="mb-4 self-start text-[13px] text-[#99a1af] hover:text-[#6a7282] transition-colors"
            >
              직접 검색하기 →
            </button>
          )}

          {showSearch && (
            <div className="mb-6">
              <RegionPicker
                value={region}
                onChange={(r) => { setRegion(r); setCoords(null); }}
              />
            </div>
          )}

          {!showSearch && <div className="mb-4" />}

          <div className="mt-auto pb-2 safe-bottom">
            <button
              onClick={onComplete}
              disabled={!isValid || saving}
              className="w-full py-4 bg-[#ae49fd] text-white text-[16px] font-bold rounded-2xl disabled:opacity-40 transition-opacity"
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-white/80 text-[16px]">
      <div className="w-1.5 h-1.5 bg-white/60 rounded-full shrink-0" />
      {text}
    </div>
  );
}
