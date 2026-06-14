import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MyApplicationItem, HostPendingItem } from "../api/applications";
import type { CoffeeChatIncoming, CoffeeChatOutgoing } from "../api/coffeechat";

const DISMISSED_CHATS_KEY = "coffeechat_dismissed_ids";

function loadDismissedChats(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_CHATS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedChats(ids: Set<string>) {
  localStorage.setItem(DISMISSED_CHATS_KEY, JSON.stringify([...ids]));
}

function CoffeechatIcon({ accepted = false }: { accepted?: boolean }) {
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${accepted ? "bg-[#ae49fd]" : "bg-[rgba(49,130,246,0.1)]"}`}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.75654 8.28125C6.33304 8.28125 5.98975 8.62454 5.98975 9.04804V12.2917C5.98975 12.8691 6.21912 13.4228 6.6274 13.8311C7.03568 14.2394 7.58943 14.4688 8.16683 14.4688H10.9168C11.4942 14.4688 12.048 14.2394 12.4563 13.8311C12.8645 13.4228 13.0939 12.8691 13.0939 12.2917V11.7188H13.4377C13.8327 11.7188 14.2116 11.5618 14.491 11.2825C14.7703 11.0031 14.9272 10.6242 14.9272 10.2292C14.9272 9.8341 14.7703 9.45522 14.491 9.17587C14.2116 8.89652 13.8327 8.73958 13.4377 8.73958H13.0206C12.9087 8.48475 12.67 8.28125 12.3271 8.28125H6.75654Z" fill={accepted ? "white" : "#3182F6"}/>
        <path d="M9.42227 5.94131C9.41308 5.98584 9.39515 6.02809 9.36952 6.06564L8.45285 7.44064C8.40182 7.51539 8.32336 7.567 8.23451 7.58427C8.14566 7.60153 8.05358 7.58305 7.97827 7.53284C7.90296 7.48264 7.85049 7.40475 7.83225 7.31609C7.81401 7.22744 7.83147 7.13516 7.88085 7.0593L8.79752 5.6843C8.82232 5.6462 8.85443 5.6134 8.89199 5.5878C8.92955 5.56219 8.97182 5.54429 9.01635 5.53513C9.06087 5.52597 9.10678 5.52573 9.1514 5.53443C9.19602 5.54313 9.23847 5.56059 9.27629 5.58581C9.31412 5.61103 9.34656 5.64349 9.37176 5.68134C9.39695 5.71918 9.41438 5.76164 9.42305 5.80627C9.43172 5.85089 9.43146 5.89679 9.42227 5.94131Z" fill={accepted ? "white" : "#3182F6"} fillOpacity={accepted ? 1 : 0.3}/>
        <path d="M10.7973 5.94131C10.7881 5.98584 10.7701 6.02809 10.7445 6.06564L9.82785 7.44064C9.80305 7.47874 9.77094 7.51154 9.73338 7.53715C9.69582 7.56275 9.65355 7.58065 9.60902 7.58981C9.56449 7.59897 9.51859 7.59921 9.47397 7.59051C9.42935 7.58181 9.3869 7.56435 9.34908 7.53913C9.31125 7.51392 9.2788 7.48145 9.26361 7.44361C9.23842 7.40576 9.22098 7.3633 9.21231 7.31868C9.20364 7.27405 9.20391 7.22815 9.2031 7.18363C9.21229 7.13911 9.23022 7.09685 9.25585 7.0593L10.1725 5.6843C10.1973 5.6462 10.2294 5.6134 10.267 5.5878C10.3046 5.56219 10.3468 5.54429 10.3913 5.53513C10.4359 5.52597 10.4818 5.52573 10.5264 5.53443C10.571 5.54313 10.6135 5.56059 10.6513 5.58581C10.6891 5.61103 10.7216 5.64349 10.7468 5.68134C10.7719 5.71918 10.7894 5.76164 10.7981 5.80627C10.8067 5.85089 10.8065 5.89679 10.7973 5.94131Z" fill={accepted ? "white" : "#3182F6"} fillOpacity={accepted ? 1 : 0.3}/>
        <path d="M12.1723 5.94131C12.1631 5.98584 12.1451 6.02809 12.1195 6.06564L11.2028 7.44064C11.1781 7.47874 11.1459 7.51154 11.1084 7.53715C11.0708 7.56275 11.0285 7.58065 10.984 7.58981C10.9395 7.59897 10.8936 7.59921 10.849 7.59051C10.8044 7.58181 10.7619 7.56435 10.7241 7.53913C10.6863 7.51392 10.6538 7.48145 10.6286 7.44361C10.6034 7.40576 10.586 7.3633 10.5773 7.31868C10.5686 7.27405 10.5689 7.22815 10.5781 7.18363C10.5873 7.13911 10.6052 7.09685 10.6309 7.0593L11.5475 5.6843C11.5723 5.6462 11.6044 5.6134 11.642 5.5878C11.6796 5.56219 11.7218 5.54429 11.7663 5.53513C11.8109 5.52597 11.8568 5.52573 11.9014 5.53443C11.946 5.54313 11.9885 5.56059 12.0263 5.58581C12.0641 5.61103 12.0966 5.64349 12.1218 5.68134C12.1469 5.71918 12.1644 5.76164 12.1731 5.80627C12.1817 5.85089 12.1815 5.89679 12.1723 5.94131Z" fill={accepted ? "white" : "#3182F6"} fillOpacity={accepted ? 1 : 0.3}/>
      </svg>
    </div>
  );
}

function formatDate(isoStr: string) {
  const d = new Date(isoStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  myApplications: MyApplicationItem[];
  hostPending: HostPendingItem[];
  incomingChats: CoffeeChatIncoming[];
  outgoingChats: CoffeeChatOutgoing[];
  onAcceptChat: (chatId: string) => Promise<void>;
  loading: boolean;
}

export function ApplicationStatusPanel({ myApplications, hostPending, incomingChats, outgoingChats, onAcceptChat, loading }: Props) {
  const navigate = useNavigate();
  const [dismissedChatIds, setDismissedChatIds] = useState<Set<string>>(loadDismissedChats);

  function dismissChat(id: string) {
    setDismissedChatIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedChats(next);
      return next;
    });
  }

  // 모임 현황: start_at이 지난 모임은 자동 숨김
  const now = new Date();
  const activeApplications = myApplications.filter(
    (m) => !m.meetup_start_at || new Date(m.meetup_start_at) >= now
  );
  const activeHostPending = hostPending.filter(
    (m) => !m.meetup_start_at || new Date(m.meetup_start_at) >= now
  );

  // 커피챗: 사용자가 X로 닫은 카드 제외
  const acceptedChats = [
    ...incomingChats.filter((c) => c.status === "accepted").map((c) => ({
      id: c.id, nickname: c.requester_nickname, email: c.requester_email,
    })),
    ...outgoingChats.filter((c) => c.status === "accepted").map((c) => ({
      id: c.id, nickname: c.recipient_nickname, email: c.recipient_email,
    })),
  ].filter((item) => !dismissedChatIds.has(item.id));

  const isEmpty =
    activeApplications.length === 0 &&
    activeHostPending.length === 0 &&
    incomingChats.filter((c) => c.status === "pending").length === 0 &&
    acceptedChats.length === 0 &&
    outgoingChats.filter((c) => c.status === "pending").length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 모임 현황 */}
      <div className="flex flex-col gap-3">
        <p className="text-[14px] font-bold text-[#101828] tracking-[-0.32px]">내 모임 현황</p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-[12px] bg-[#f3f4f6] animate-pulse" />
            ))}
          </div>
        ) : activeApplications.length === 0 && activeHostPending.length === 0 ? (
          <p className="text-[12px] text-[#99a1af] tracking-[-0.32px] py-1">신청한 모임이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">

            {/* 호스트 뷰 — 신청자 대기 중 */}
            {activeHostPending.map((item) => (
              <button
                key={item.meetup_id}
                onClick={() => navigate(`/meetup/${item.meetup_id}/applications`)}
                className="w-full text-left bg-white rounded-[12px] p-3 flex items-start gap-2.5 hover:bg-[#f9fafb] transition-colors"
              >
                <img src="/icons/applicant-accepted.svg" width={20} height={20} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{item.meetup_title}</p>
                  <p className="text-[12px] font-medium text-[#2fa97d] mt-0.5 tracking-[-0.32px]">신청자 {item.pending_count}명 대기 중</p>
                </div>
              </button>
            ))}

            {/* 신청자 뷰 */}
            {activeApplications.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/meetup/${item.meetup_id}`)}
                className="w-full text-left bg-white rounded-[12px] p-3 flex items-start gap-2.5 hover:bg-[#f9fafb] transition-colors"
              >
                <img
                  src={item.status === "accepted" ? "/icons/host-except.svg" : "/icons/applicant-pending.svg"}
                  width={20}
                  height={20}
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{item.meetup_title}</p>
                  <p className={`text-[12px] font-medium mt-0.5 tracking-[-0.32px] ${item.status === "accepted" ? "text-[#ae49fd]" : "text-[#9ca3af]"}`}>
                    {item.status === "accepted" ? "수락됨" : "승인 대기 중"}
                    {item.meetup_start_at && ` · ${formatDate(item.meetup_start_at)}`}
                  </p>
                </div>
              </button>
            ))}

          </div>
        )}
      </div>

      {/* 커피챗 현황 */}
      {!loading && (
        incomingChats.filter((c) => c.status === "pending").length > 0 ||
        acceptedChats.length > 0 ||
        outgoingChats.filter((c) => c.status === "pending").length > 0
      ) && (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-bold text-[#101828] tracking-[-0.32px]">커피챗</p>
          <div className="flex flex-col gap-2">

            {/* 받은 신청 (pending) */}
            {incomingChats.filter((c) => c.status === "pending").map((chat) => (
              <div key={chat.id} className="bg-white rounded-[12px] p-3 flex flex-col gap-[10px]">
                <div className="flex items-center gap-[10px]">
                  <CoffeechatIcon />
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">
                    {chat.requester_nickname}님이 신청했어요
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptChat(chat.id)}
                    className="flex-1 py-[6px] bg-[#ae49fd] text-white text-[10px] font-semibold rounded-[6px] tracking-[-0.32px]"
                  >
                    수락하기
                  </button>
                  <button
                    onClick={() => navigate(`/user/${chat.requester_nickname}`)}
                    className="flex-1 py-[6px] bg-[#f5f6f7] text-[#6a7282] text-[10px] font-semibold rounded-[6px] tracking-[-0.32px]"
                  >
                    프로필 보기
                  </button>
                </div>
              </div>
            ))}

            {/* 연결된 커피챗 (accepted) */}
            {acceptedChats.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/user/${item.nickname}`)}
                className="relative w-full text-left bg-[#ede2ff] rounded-[12px] p-3 flex items-start gap-[10px] hover:bg-[#e4d6fc] transition-colors"
              >
                {/* 아바타 (20px 원) */}
                <div className="w-5 h-5 rounded-full bg-[#ae49fd] flex items-center justify-center shrink-0 mt-px">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                    <path d="M6.75654 8.28125C6.33304 8.28125 5.98975 8.62454 5.98975 9.04804V12.2917C5.98975 12.8691 6.21912 13.4228 6.6274 13.8311C7.03568 14.2394 7.58943 14.4688 8.16683 14.4688H10.9168C11.4942 14.4688 12.048 14.2394 12.4563 13.8311C12.8645 13.4228 13.0939 12.8691 13.0939 12.2917V11.7188H13.4377C13.8327 11.7188 14.2116 11.5618 14.491 11.2825C14.7703 11.0031 14.9272 10.6242 14.9272 10.2292C14.9272 9.8341 14.7703 9.45522 14.491 9.17587C14.2116 8.89652 13.8327 8.73958 13.4377 8.73958H13.0206C12.9087 8.48475 12.67 8.28125 12.3271 8.28125H6.75654Z" fill="white"/>
                    <path d="M9.42227 5.94131C9.41308 5.98584 9.39515 6.02809 9.36952 6.06564L8.45285 7.44064C8.40182 7.51539 8.32336 7.567 8.23451 7.58427C8.14566 7.60153 8.05358 7.58305 7.97827 7.53284C7.90296 7.48264 7.85049 7.40475 7.83225 7.31609C7.81401 7.22744 7.83147 7.13516 7.88085 7.0593L8.79752 5.6843C8.82232 5.6462 8.85443 5.6134 8.89199 5.5878C8.92955 5.56219 8.97182 5.54429 9.01635 5.53513C9.06087 5.52597 9.10678 5.52573 9.1514 5.53443C9.19602 5.54313 9.23847 5.56059 9.27629 5.58581C9.31412 5.61103 9.34656 5.64349 9.37176 5.68134C9.39695 5.71918 9.41438 5.76164 9.42305 5.80627C9.43172 5.85089 9.43146 5.89679 9.42227 5.94131Z" fill="white" fillOpacity="0.6"/>
                    <path d="M10.7973 5.94131C10.7881 5.98584 10.7701 6.02809 10.7445 6.06564L9.82785 7.44064C9.80305 7.47874 9.77094 7.51154 9.73338 7.53715C9.69582 7.56275 9.65355 7.58065 9.60902 7.58981C9.56449 7.59897 9.51859 7.59921 9.47397 7.59051C9.42935 7.58181 9.3869 7.56435 9.34908 7.53913C9.31125 7.51392 9.2788 7.48145 9.26361 7.44361C9.23842 7.40576 9.22098 7.3633 9.21231 7.31868C9.20364 7.27405 9.20391 7.22815 9.2031 7.18363C9.21229 7.13911 9.23022 7.09685 9.25585 7.0593L10.1725 5.6843C10.1973 5.6462 10.2294 5.6134 10.267 5.5878C10.3046 5.56219 10.3468 5.54429 10.3913 5.53513C10.4359 5.52597 10.4818 5.52573 10.5264 5.53443C10.571 5.54313 10.6135 5.56059 10.6513 5.58581C10.6891 5.61103 10.7216 5.64349 10.7468 5.68134C10.7719 5.71918 10.7894 5.76164 10.7981 5.80627C10.8067 5.85089 10.8065 5.89679 10.7973 5.94131Z" fill="white" fillOpacity="0.6"/>
                    <path d="M12.1723 5.94131C12.1631 5.98584 12.1451 6.02809 12.1195 6.06564L11.2028 7.44064C11.1781 7.47874 11.1459 7.51154 11.1084 7.53715C11.0708 7.56275 11.0285 7.58065 10.984 7.58981C10.9395 7.59897 10.8936 7.59921 10.849 7.59051C10.8044 7.58181 10.7619 7.56435 10.7241 7.53913C10.6863 7.51392 10.6538 7.48145 10.6286 7.44361C10.6034 7.40576 10.586 7.3633 10.5773 7.31868C10.5686 7.27405 10.5689 7.22815 10.5781 7.18363C10.5873 7.13911 10.6052 7.09685 10.6309 7.0593L11.5475 5.6843C11.5723 5.6462 11.6044 5.6134 11.642 5.5878C11.6796 5.56219 11.7218 5.54429 11.7663 5.53513C11.8109 5.52597 11.8568 5.52573 11.9014 5.53443C11.946 5.54313 11.9885 5.56059 12.0263 5.58581C12.0641 5.61103 12.0966 5.64349 12.1218 5.68134C12.1469 5.71918 12.1644 5.76164 12.1731 5.80627C12.1817 5.85089 12.1815 5.89679 12.1723 5.94131Z" fill="white" fillOpacity="0.6"/>
                  </svg>
                </div>
                {/* 텍스트 */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{item.nickname}</p>
                  {item.email && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-[12px] font-medium text-[#6b6b73] tracking-[-0.32px] truncate">{item.email}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.email!); }}
                        className="shrink-0 hover:opacity-70 transition-opacity"
                        aria-label="이메일 복사"
                      >
                        <img src="/icons/copy_purple.svg" width={16} height={16} />
                      </button>
                    </div>
                  )}
                </div>
                {/* X 버튼 (absolute 우상단) */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismissChat(item.id); }}
                  className="absolute top-3 right-3 hover:opacity-60 transition-opacity"
                  aria-label="카드 닫기"
                >
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </button>
            ))}

            {/* 내가 보낸 대기 중 */}
            {outgoingChats.filter((c) => c.status === "pending").map((chat) => (
              <button key={chat.id} onClick={() => navigate(`/user/${chat.recipient_nickname}`)} className="w-full text-left bg-white rounded-[12px] p-3 flex items-center gap-[10px] hover:bg-[#f9fafb] transition-colors">
                <CoffeechatIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#101828] tracking-[-0.32px] truncate">{chat.recipient_nickname}</p>
                  <p className="text-[12px] font-medium text-[#9ca3af] mt-0.5 tracking-[-0.32px]">수락 대기 중</p>
                </div>
              </button>
            ))}

          </div>
        </div>
      )}

      {!loading && isEmpty && (
        <p className="text-[12px] text-[#99a1af] tracking-[-0.32px] py-2">아직 활동 내역이 없어요</p>
      )}
    </div>
  );
}

// 모바일용 슬라이드업 드로어
interface DrawerProps extends Props {
  open: boolean;
  onClose: () => void;
}

export function ApplicationStatusDrawer({ open, onClose, ...panelProps }: DrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-[#f5f6f8] rounded-t-[24px] px-4 pt-5 pb-8 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#d1d5dc] rounded-full mx-auto mb-5" />
        <ApplicationStatusPanel {...panelProps} />
      </div>
    </div>
  );
}
