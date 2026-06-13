import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getApplications, acceptApplication, type Application } from "../api/applications";
import { UserAvatar } from "../components/UserAvatar";
import { getMeetupById, updateMeetup } from "../api/meetups";


const STATUS_TABS = ["전체", "대기 중", "수락"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function ApplicationsScreen() {
  const { id: meetupId } = useParams<{ id: string }>();

  const [meetupTitle, setMeetupTitle] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>("전체");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetupId) return;
    setLoading(true);
    Promise.all([
      getMeetupById(meetupId),
      getApplications(meetupId),
    ])
      .then(([meetup, apps]) => {
        if (meetup) {
          setMeetupTitle(meetup.title);
          setCapacity(meetup.capacity);
        }
        setApplications(apps);
      })
      .catch(() => setError("데이터를 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, [meetupId]);

  const acceptedCount = applications.filter((a) => a.status === "accepted").length;
  const isFull = acceptedCount >= capacity;

  const filtered = applications.filter((a) => {
    if (activeTab === "전체") return true;
    if (activeTab === "대기 중") return a.status === "pending";
    if (activeTab === "수락") return a.status === "accepted";
    return true;
  });

  async function accept(app: Application) {
    setActionLoading(app.id);
    setError(null);
    try {
      await acceptApplication(app.id);
      const next = applications.map((a) => a.id === app.id ? { ...a, status: "accepted" as const } : a);
      setApplications(next);
      const newAcceptedCount = next.filter((a) => a.status === "accepted").length;
      if (meetupId && newAcceptedCount >= capacity) {
        await updateMeetup(meetupId, { status: "closed" });
      }
    } catch {
      setError("수락 처리 중 오류가 발생했어요");
    }
    setActionLoading(null);
  }

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">
      <div className="flex flex-col gap-4 py-6 px-4 flex-1">

        {/* 헤더 + 정원 요약 */}
        <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-[#101828] tracking-[-0.32px]">신청자 목록</h1>
            {meetupTitle && (
              <p className="text-[14px] text-[#99a1af] mt-1 line-clamp-1 tracking-[-0.32px]">{meetupTitle}</p>
            )}
          </div>

          {!loading && (
            <div className="bg-[rgba(244,246,250,0.5)] rounded-[12px] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/icons/group.svg" width={18} height={18} className="opacity-60" />
                <span className="text-[14px] font-semibold text-[#364153] tracking-[-0.32px]">수락 인원</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-bold text-[#ae49fd] tracking-[-0.32px]">{acceptedCount}</span>
                <span className="text-[14px] text-[#99a1af] tracking-[-0.32px]">/ {capacity}명</span>
                {isFull && (
                  <span className="ml-2 px-2 py-0.5 bg-[#f3f4f6] text-[#99a1af] text-[12px] font-semibold rounded-full">
                    마감
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-[12px] px-4 py-3 text-[14px] text-red-500 tracking-[-0.32px]">
            {error}
          </div>
        )}

        {/* 탭 필터 */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === "전체" ? applications.length
              : applications.filter((a) =>
                  (tab === "대기 중" && a.status === "pending") ||
                  (tab === "수락"   && a.status === "accepted")
                ).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors tracking-[-0.32px] ${
                  activeTab === tab
                    ? "bg-[#101828] text-white"
                    : "bg-[#f1f3f7] text-[#6a7282]"
                }`}
              >
                {tab} {count > 0 && <span className="opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#ae49fd] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-[#99a1af] tracking-[-0.32px]">해당 신청자가 없어요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                isFull={isFull}
                isLoading={actionLoading === app.id}
                onAccept={() => accept(app)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  isFull,
  isLoading,
  onAccept,
}: {
  app: Application;
  isFull: boolean;
  isLoading: boolean;
  onAccept: () => void;
}) {
  const date = new Date(app.created_at);
  const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[16px] px-5 py-4">
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar avatarUrl={app.avatar_url} nickname={app.nickname} className="w-9 h-9 text-[13px]" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#101828] tracking-[-0.32px]">{app.nickname}</p>
          {app.status === "accepted" && app.email ? (
            <p className="text-[12px] text-[#ae49fd] mt-0.5 tracking-[-0.32px]">{app.email}</p>
          ) : (
            <p className="text-[12px] text-[#99a1af] mt-0.5 tracking-[-0.32px]">신청 {timeStr}</p>
          )}
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.status === "pending" && (
        <button
          onClick={onAccept}
          disabled={isFull || isLoading}
          className="w-full py-2.5 bg-[#ae49fd] text-white text-[14px] font-semibold rounded-[12px] disabled:bg-[#f3f4f6] disabled:text-[#99a1af] transition-colors tracking-[-0.32px]"
        >
          {isLoading ? "처리 중..." : isFull ? "정원 마감" : "수락하기"}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Application["status"] }) {
  if (status === "accepted") {
    return <span className="px-2.5 py-1 bg-[#f4e5ff] text-[#ae49fd] text-[12px] font-semibold rounded-full shrink-0">수락</span>;
  }
  return <span className="px-2.5 py-1 bg-[#fef3c7] text-[#d97706] text-[12px] font-semibold rounded-full shrink-0">대기 중</span>;
}
