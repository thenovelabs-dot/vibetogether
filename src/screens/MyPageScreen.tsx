import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/userContextValue";
import type { ApplicationStatus } from "../types";
import { updateUserRegion, updateUserAITools, updateUserJobRole, updateUserNickname, uploadUserAvatar, updateUserAvatar, isNicknameAvailable, getMyApplications, getMyMeetups, getCommentedMeetups, getMyProducts, deleteAccount } from "../api/users";
import { ConfirmModal } from "../components/ConfirmModal";
import { useToast } from "../components/toastContext";
import { RegionPicker } from "../components/RegionPicker";
import { features } from "../config/features";

const JOB_LABELS: Record<string, string> = {
  developer: "개발자", designer: "디자이너", pm: "기획자 / PM",
  marketer: "마케터", ceo: "대표 / CEO", investor: "투자자",
  sales: "세일즈", content: "콘텐츠", data: "데이터", other: "기타",
};

const TABS = features.meetups ? ["내가 쓴 글", "댓글 단 글", "내 신청"] as const : [] as const;
type Tab = (typeof TABS)[number];

interface MyApplication {
  id: string;
  status: ApplicationStatus;
  host_email: string | null;
  created_at: string;
  meetup: { id: string; title: string; place_name: string; start_at: string } | null;
}

interface MyProduct {
  id: string;
  title: string;
  icon_url: string | null;
}

type RawMyProduct = {
  id: string;
  title: string;
  icon_url?: string | null;
};

type RawMyApplication = {
  id: string;
  status: ApplicationStatus;
  host_email?: string | null;
  created_at: string;
  meetup: MyApplication["meetup"] | MyApplication["meetup"][];
};

const AVATAR_COLORS = [
  "bg-violet-400", "bg-blue-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];
const ICON_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-700",
  "from-amber-400 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-blue-700",
];


function meetupDateStr(isoStr: string) {
  const date = new Date(isoStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]}) ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function relativeTime(isoStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

export default function MyPageScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab | null>(features.meetups ? "내가 쓴 글" : null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const { profile, session, refreshProfile, signOut } = useUser();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  const [myMeetups, setMyMeetups] = useState<{ id: string; title: string; place_name: string; start_at: string; created_at: string }[]>([]);
  const [commentedMeetups, setCommentedMeetups] = useState<{ id: string; title: string; place_name: string; start_at: string; created_at: string }[]>([]);
  const [myProducts, setMyProducts] = useState<MyProduct[]>([]);

  const meetupList = tab === "내가 쓴 글" ? myMeetups : commentedMeetups;
  const products = myProducts;

  const avatarColor = profile?.nickname
    ? AVATAR_COLORS[profile.nickname.charCodeAt(0) % AVATAR_COLORS.length]
    : "bg-violet-400";

  const tabCounts: Partial<Record<Tab, number>> = {
    "내가 쓴 글": myMeetups.length,
    "댓글 단 글": commentedMeetups.length,
    "내 신청": myApplications.length,
  };

  useEffect(() => {
    if (!session) return;
    if (features.meetups) {
      getMyMeetups(session.user.id).then(setMyMeetups).catch(() => {});
      getCommentedMeetups(session.user.id).then(setCommentedMeetups).catch(() => {});
    }
    getMyProducts(session.user.id)
      .then((data) => setMyProducts((data as RawMyProduct[]).map((s) => ({ id: s.id, title: s.title, icon_url: s.icon_url ?? null }))))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (!features.meetups) return;
    if (tab === "내 신청") setApplicationsLoading(true);
    getMyApplications(session.user.id)
      .then((data) => setMyApplications(
        (data as RawMyApplication[]).map((d) => ({
          id: d.id,
          status: d.status,
          host_email: d.host_email ?? null,
          created_at: d.created_at,
          meetup: Array.isArray(d.meetup) ? (d.meetup[0] ?? null) : d.meetup,
        }))
      ))
      .catch(() => {})
      .finally(() => setApplicationsLoading(false));
  }, [session, tab]);

  async function shareProfile() {
    const url = `${window.location.origin}/user/${encodeURIComponent(profile?.nickname ?? "")}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast("링크가 복사됐어요", "info");
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast("링크 복사에 실패했어요");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await deleteAccount();
      await signOut();
      navigate("/login", { replace: true });
    } catch (e) {
      toast(e instanceof Error ? e.message : "탈퇴에 실패했어요. 다시 시도해주세요");
      setWithdrawing(false);
      setConfirmWithdraw(false);
    }
  }

  async function saveAll(nickname: string, avatarFile: File | null, region: string, aiTools: string[], jobRole: string) {
    if (!session) return;
    setSaving(true);
    try {
      if (avatarFile) {
        let url: string;
        try {
          url = await uploadUserAvatar(session.user.id, avatarFile);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : JSON.stringify(e);
          throw new Error("사진 업로드에 실패했어요: " + message);
        }
        await updateUserAvatar(session.user.id, url);
      }
      await Promise.all([
        nickname !== profile?.nickname ? updateUserNickname(session.user.id, nickname) : Promise.resolve(),
        region !== profile?.region ? updateUserRegion(session.user.id, region) : Promise.resolve(),
        updateUserAITools(session.user.id, aiTools),
        jobRole ? updateUserJobRole(session.user.id, jobRole) : Promise.resolve(),
      ]);
      await refreshProfile();
      toast("프로필이 저장됐어요");
      setEditing(false);
    } catch (e: unknown) {
      console.error("saveAll error:", e);
      toast(e instanceof Error ? e.message : JSON.stringify(e) || "저장에 실패했어요");
      await refreshProfile().catch(() => {});
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      {confirmWithdraw && (
        <ConfirmModal
          title="정말 탈퇴할까요?"
          message="탈퇴하면 모든 데이터가 삭제되고 복구할 수 없어요."
          confirmLabel="탈퇴하기"
          onConfirm={handleWithdraw}
          onCancel={() => setConfirmWithdraw(false)}
          loading={withdrawing}
        />
      )}
      <div className="flex flex-col gap-4 py-6 px-4">

        {/* 프로필 카드 */}
        {!editing && <div className="bg-white rounded-[16px] p-5 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {/* 아바타 + 버튼 row */}
            <div className="flex items-center justify-between">
              {profile?.avatar_url && !avatarError ? (
                <img
                  src={profile.avatar_url}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className={`w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-white text-[22px] font-bold shrink-0`}>
                  {profile?.nickname?.[0] ?? "?"}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={shareProfile}
                  className="w-9 h-9 flex items-center justify-center rounded-[12px] bg-[#f5f6f7] hover:bg-[#e9eaec] transition-colors"
                  title="프로필 링크 공유"
                >
                  {shareCopied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#ae49fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#6a7282" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-[12px] bg-[#f5f6f7] text-[14px] font-semibold text-[#6a7282] hover:bg-[#e9eaec] transition-colors"
                >
                  프로필 수정
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-[12px] bg-[#f5f6f7] hover:bg-[#fee2e2] hover:text-red-400 text-[#6a7282] transition-colors disabled:opacity-50"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[13px] font-semibold tracking-[-0.32px]">
                    {signingOut ? "로그아웃 중..." : "로그아웃"}
                  </span>
                </button>
              </div>
            </div>
            {/* 닉네임 + 정보 */}
            <div>
              <p className="text-[18px] font-bold text-[#101828] tracking-[-0.32px]">
                {profile?.nickname || "닉네임 없음"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <img src="/icons/location.svg" width={13} height={13} className="opacity-50 shrink-0" />
                  <p className="text-[13px] text-[#99a1af] tracking-[-0.32px]">
                    {profile?.region || "위치 없음"}
                  </p>
                </div>
                {profile?.job_role && (
                  <>
                    <span className="text-[#e5e7eb]">·</span>
                    <span className="text-[13px] text-[#99a1af] tracking-[-0.32px]">
                      {JOB_LABELS[profile.job_role] ?? profile.job_role}
                    </span>
                  </>
                )}
              </div>
              {profile?.ai_tools && profile.ai_tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {profile.ai_tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 bg-[#f4e5ff] text-[#ae49fd] text-[11px] font-semibold rounded-full tracking-[-0.32px]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-[#f3f4f6]" />
          <div className="flex items-center">
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-bold text-[#101828]">{products.length}</p>
              <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">프로젝트</p>
            </div>
            <div className="w-px h-8 bg-[#f3f4f6]" />
            {features.meetups && (
              <>
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <p className="text-[18px] font-bold text-[#101828]">{myMeetups.length}</p>
                  <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">작성한 모임</p>
                </div>
                <div className="w-px h-8 bg-[#f3f4f6]" />
              </>
            )}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-bold text-[#101828]">{commentedMeetups.length}</p>
              <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">{features.meetups ? "댓글 단 글" : "활동"}</p>
            </div>
          </div>
        </div>}

        {editing && (
          <ProfileEditor
            currentNickname={profile?.nickname ?? ""}
            currentAvatarUrl={profile?.avatar_url ?? null}
            currentRegion={profile?.region ?? ""}
            currentAiTools={profile?.ai_tools ?? []}
            currentJobRole={profile?.job_role ?? ""}
            saving={saving}
            onSaveAll={saveAll}
            onCancel={() => setEditing(false)}
          />
        )}

        {/* 내 프로젝트 카드 */}
        {!editing && (
          <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#364153] tracking-[-0.32px]">내 프로젝트</span>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-1 no-scrollbar">
              {products.map((item) => (
                <ProductBadgeCard key={item.id} item={item} />
              ))}
              {products.length === 0 && (
                <button
                  onClick={() => navigate("/product/new")}
                  className="shrink-0 w-20 h-20 flex flex-col items-center justify-center border border-dashed border-[#d1d5db] rounded-[22px] text-[#99a1af] hover:border-[#ae49fd] hover:text-[#ae49fd] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 피드 탭 + 아이템 */}
        {!editing && features.meetups && tab && (
          <div className="flex flex-col gap-3">
            {/* 칩 탭 */}
            <div className="flex gap-2 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full text-[14px] font-semibold tracking-[-0.32px] transition-colors ${
                    tab === t ? "bg-[#101828] text-white" : "bg-[#f3f4f6] text-[#636e7f]"
                  }`}
                >
                  <span>{t}</span>
                  <span className="text-[#ae49fd]">{tabCounts[t] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* 피드 아이템 */}
            {tab === "내 신청" ? (
              applicationsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : myApplications.length === 0 ? (
                <Empty text="아직 신청한 모임이 없어요" />
              ) : (
                <div className="flex flex-col gap-3">
                  {myApplications.map((app) => (
                    <ApplicationItem
                      key={app.id}
                      app={app}
                      onClick={() => app.meetup && navigate(`/meetup/${app.meetup.id}`)}
                    />
                  ))}
                </div>
              )
            ) : meetupList.length === 0 ? (
              <Empty text="아직 없어요" />
            ) : (
              <div className="flex flex-col gap-3">
                {meetupList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/meetup/${item.id}`)}
                    className="bg-white rounded-[16px] p-4 flex flex-col gap-1.5 text-left hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="px-[6px] py-[3px] bg-[#e6eaf1] text-[#6a7282] text-[10px] font-bold rounded-full tracking-[-0.32px]">
                        모임
                      </span>
                      <span className="text-[12px] font-medium text-[#99a1af] tracking-[-0.32px]">
                        {relativeTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px] line-clamp-1">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <img src="/icons/location.svg" width={14} height={14} className="shrink-0" />
                      <span className="text-[13px] text-[#6a7282] tracking-[-0.32px]">{item.place_name}</span>
                      <span className="text-[#d1d5dc]">·</span>
                      <img src="/icons/calender.svg" width={14} height={14} className="shrink-0" />
                      <span className="text-[13px] text-[#6a7282] tracking-[-0.32px]">{meetupDateStr(item.start_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 하단 링크 */}
      <div className="px-4 pb-8 pt-2 flex items-center justify-center gap-4">
        <button
          onClick={() => navigate("/about")}
          className="text-[13px] text-[#99a1af] hover:text-[#6a7282] transition-colors tracking-[-0.32px]"
        >
          서비스 소개
        </button>
        <span className="text-[#e5e7eb]">·</span>
        <button
          onClick={() => setConfirmWithdraw(true)}
          className="text-[13px] text-[#99a1af] hover:text-red-400 transition-colors tracking-[-0.32px]"
        >
          회원 탈퇴
        </button>
      </div>

    </div>
  );
}

// ── 서브 컴포넌트 ─────────────────────────────────────────

function ApplicationItem({ app, onClick }: { app: MyApplication; onClick: () => void }) {
  const meetup = app.meetup;
  if (!meetup) return null;

  const statusConfig = ({
    pending:  { label: "대기 중", bg: "bg-[#f3f4f6]",  text: "text-[#6a7282]" },
    accepted: { label: "수락됨",  bg: "bg-[#f3e8ff]",  text: "text-[#ae49fd]" },
  } as Record<string, { label: string; bg: string; text: string }>)[app.status]
    ?? { label: "대기 중", bg: "bg-[#f3f4f6]", text: "text-[#6a7282]" };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[16px] p-4 flex flex-col gap-1.5 text-left hover:shadow-[0px_4px_10px_rgba(0,0,0,0.1)] transition-shadow w-full"
    >
      <div className="flex items-start justify-between w-full">
        <span className="px-[6px] py-[3px] bg-[#e6eaf1] text-[#6a7282] text-[10px] font-bold rounded-full tracking-[-0.32px]">
          모임
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </span>
      </div>
      <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px] line-clamp-1">
        {meetup.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <img src="/icons/location.svg" width={14} height={14} className="shrink-0" />
        <span className="text-[13px] text-[#6a7282] tracking-[-0.32px]">{meetup.place_name}</span>
        <span className="text-[#d1d5dc]">·</span>
        <img src="/icons/calender.svg" width={14} height={14} className="shrink-0" />
        <span className="text-[13px] text-[#6a7282] tracking-[-0.32px]">{meetupDateStr(meetup.start_at)}</span>
      </div>
      {app.status === "accepted" && app.host_email && (
        <div className="flex items-center gap-1.5 mt-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#ae49fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22,6 12,13 2,6" stroke="#ae49fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[12px] text-[#ae49fd] tracking-[-0.32px]">{app.host_email}</span>
        </div>
      )}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">{text}</p>
    </div>
  );
}

function ProductBadgeCard({ item }: { item: MyProduct }) {
  const navigate = useNavigate();
  const gradient = ICON_GRADIENTS[item.title.charCodeAt(0) % ICON_GRADIENTS.length];

  return (
    <div
      className="shrink-0 flex flex-col gap-3 items-center cursor-pointer"
      onClick={() => navigate(`/product/${item.id}`)}
    >
      {item.icon_url ? (
        <img src={item.icon_url} alt={item.title} className="w-20 h-20 rounded-[22px] object-cover" />
      ) : (
        <div className={`w-20 h-20 rounded-[22px] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-[32px] font-bold text-white leading-none">{item.title[0]}</span>
        </div>
      )}
      <p className="text-[14px] text-[#101828] text-center tracking-[-0.32px] line-clamp-1 max-w-[80px]">
        {item.title}
      </p>
    </div>
  );
}

const AI_TOOLS = [
  "ChatGPT", "Claude", "Cursor", "GitHub Copilot", "Gemini",
  "Windsurf", "v0", "Perplexity", "Bolt", "Lovable", "Replit", "Cline",
];

function ProfileEditor({ currentNickname, currentAvatarUrl, currentRegion, currentAiTools, currentJobRole, saving, onSaveAll, onCancel }: {
  currentNickname: string;
  currentAvatarUrl: string | null;
  currentRegion: string;
  currentAiTools: string[];
  currentJobRole: string;
  saving: boolean;
  onSaveAll: (nickname: string, avatarFile: File | null, region: string, aiTools: string[], jobRole: string) => void;
  onCancel: () => void;
}) {
  const isPresetJob = (r: string) => r in JOB_LABELS;

  const [aiTools, setAiTools] = useState<string[]>(currentAiTools);
  const [jobRole, setJobRole] = useState(isPresetJob(currentJobRole) ? currentJobRole : "");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customToolInput, setCustomToolInput] = useState("");
  const customToolRef = React.useRef<HTMLInputElement>(null);
  const [showCustomJobInput, setShowCustomJobInput] = useState(!isPresetJob(currentJobRole));
  const [customJobInput, setCustomJobInput] = useState(isPresetJob(currentJobRole) ? "" : currentJobRole);
  const customJobRef = React.useRef<HTMLInputElement>(null);
  const [region, setRegion] = useState(currentRegion);

  React.useEffect(() => {
    if (showCustomInput) setTimeout(() => customToolRef.current?.focus(), 50);
  }, [showCustomInput]);

  React.useEffect(() => {
    if (showCustomJobInput) setTimeout(() => customJobRef.current?.focus(), 50);
  }, [showCustomJobInput]);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(currentNickname);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const avatarBg = AVATAR_COLORS[nickname.charCodeAt(0) % AVATAR_COLORS.length];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function checkNickname() {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed === currentNickname) { setNicknameStatus("idle"); return; }
    setNicknameStatus("checking");
    const ok = await isNicknameAvailable(trimmed);
    setNicknameStatus(ok ? "available" : "taken");
  }

  function toggleTool(tool: string) {
    setAiTools((prev) => prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]);
  }

  function addCustomTool() {
    const val = customToolInput.trim();
    if (!val || aiTools.includes(val)) { setCustomToolInput(""); return; }
    setAiTools((prev) => [...prev, val]);
    setCustomToolInput("");
  }

  const effectiveJobRole = showCustomJobInput ? customJobInput.trim() : jobRole;
  const saveDisabled = saving || nicknameStatus === "taken" || nicknameStatus === "checking" || !nickname.trim();

  return (
    <div className="flex flex-col gap-4">
      {/* 프로필 사진 + 닉네임 */}
      <div className="bg-white rounded-[16px] p-5 flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="relative">
            {previewUrl || currentAvatarUrl ? (
              <img src={previewUrl ?? currentAvatarUrl!} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded-full ${avatarBg} flex items-center justify-center text-white text-[24px] font-bold`}>
                {nickname?.[0] ?? "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ae49fd] rounded-full flex items-center justify-center shadow"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex flex-col items-center gap-0.5">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[12px] font-semibold text-[#ae49fd] hover:opacity-70 transition-opacity">
              사진 변경
            </button>
            {(previewUrl || currentAvatarUrl) && (
              <button type="button" onClick={() => { setPreviewUrl(null); setAvatarFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-[11px] text-[#99a1af] hover:text-red-400 transition-colors">
                제거
              </button>
            )}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[#364153] mb-2">닉네임</p>
          <input
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameStatus("idle"); }}
            onBlur={checkNickname}
            placeholder="닉네임 입력"
            maxLength={20}
            className={`w-full px-[14px] py-[14px] rounded-xl text-[14px] outline-none transition-colors tracking-[-0.32px] ${nicknameStatus === "taken" ? "bg-red-50" : nickname ? "bg-[#fbf6ff]" : "bg-[#f9fafb]"}`}
          />
          <div className="mt-1 h-4">
            {nicknameStatus === "checking" && <p className="text-[12px] text-[#99a1af]">확인 중...</p>}
            {nicknameStatus === "taken" && <p className="text-[12px] text-red-500">이미 사용 중인 닉네임이에요</p>}
            {nicknameStatus === "available" && <p className="text-[12px] text-[#ae49fd]">사용 가능한 닉네임이에요</p>}
          </div>
        </div>
      </div>

      {/* 지역 */}
      <div className="bg-white rounded-[16px] p-5">
        <p className="text-[14px] font-semibold text-[#364153] mb-3">지역</p>
        <RegionPicker value={region} onChange={setRegion} />
      </div>

      {/* AI 툴 */}
      <div className="bg-white rounded-[16px] p-5">
        <p className="text-[14px] font-semibold text-[#364153] mb-3">자주 쓰는 AI 툴</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {AI_TOOLS.map((tool) => (
            <button key={tool} onClick={() => toggleTool(tool)}
              className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${aiTools.includes(tool) ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"}`}>
              {tool}
            </button>
          ))}
          {aiTools.filter((t) => !AI_TOOLS.includes(t)).map((tool) => (
            <button key={tool} onClick={() => toggleTool(tool)} className="px-4 py-2.5 rounded-xl text-[14px] font-semibold bg-[#f4e5ff] text-[#ae49fd] flex items-center gap-1.5">
              {tool}<span className="opacity-60 text-[12px]">✕</span>
            </button>
          ))}
          <button onClick={() => setShowCustomInput((v) => !v)}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${showCustomInput ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"}`}>
            직접입력
          </button>
        </div>
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showCustomInput ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="flex gap-2">
            <input ref={customToolRef} value={customToolInput} onChange={(e) => setCustomToolInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) addCustomTool(); }}
              placeholder="사용하는 AI 툴을 입력하세요"
              className="flex-1 px-4 py-3 rounded-[12px] text-[14px] outline-none bg-[#f9fafb] text-[#101828] placeholder:text-[#99a1af] focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
            />
            <button onClick={addCustomTool} disabled={!customToolInput.trim()}
              className="w-12 h-12 rounded-[12px] bg-[#ae49fd] text-white shrink-0 disabled:opacity-40 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 직업 */}
      <div className="bg-white rounded-[16px] p-5">
        <p className="text-[14px] font-semibold text-[#364153] mb-3">직업</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(JOB_LABELS).map(([id, label]) => (
            <button key={id} onClick={() => { setJobRole(id); setShowCustomJobInput(false); setCustomJobInput(""); }}
              className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${jobRole === id && !showCustomJobInput ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"}`}>
              {label}
            </button>
          ))}
          <button onClick={() => { setShowCustomJobInput((v) => !v); setJobRole(""); }}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${showCustomJobInput ? "bg-[#f4e5ff] text-[#ae49fd]" : "bg-[#f1f3f7] text-[#898f98] hover:bg-[#e8e8e8]"}`}>
            직접입력
          </button>
        </div>
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${showCustomJobInput ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="flex gap-2">
            <input ref={customJobRef} value={customJobInput}
              onChange={(e) => setCustomJobInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing && customJobInput.trim()) setShowCustomJobInput(false); }}
              placeholder="직업을 입력하세요"
              className="flex-1 px-4 py-3 rounded-[12px] text-[14px] outline-none bg-[#f9fafb] text-[#101828] placeholder:text-[#99a1af] focus:bg-[#fbf6ff] transition-colors tracking-[-0.32px]"
            />
            <button onClick={() => { if (customJobInput.trim()) setShowCustomJobInput(false); }} disabled={!customJobInput.trim()}
              className="w-12 h-12 rounded-[12px] bg-[#ae49fd] text-white shrink-0 disabled:opacity-40 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 저장 / 취소 */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSaveAll(nickname.trim(), avatarFile, region, aiTools, effectiveJobRole)}
          disabled={saveDisabled}
          className="w-full py-4 bg-[#ae49fd] text-white text-[16px] font-bold rounded-2xl disabled:opacity-40 transition-opacity"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button onClick={onCancel} className="w-full py-3.5 text-[#99a1af] text-[14px] font-semibold hover:text-[#6a7282] transition-colors">
          취소
        </button>
      </div>
    </div>
  );
}
