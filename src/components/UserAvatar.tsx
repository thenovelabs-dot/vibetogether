import { useState } from "react";

const AVATAR_COLORS = [
  "bg-violet-400", "bg-blue-400", "bg-emerald-400",
  "bg-amber-400", "bg-rose-400", "bg-cyan-400",
];

export function UserAvatar({
  avatarUrl,
  nickname,
  className,
}: {
  avatarUrl?: string | null;
  nickname: string;
  className: string;
}) {
  const [error, setError] = useState(false);
  const color = AVATAR_COLORS[nickname.charCodeAt(0) % AVATAR_COLORS.length];

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt={nickname}
        className={`rounded-full object-cover shrink-0 ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`rounded-full ${color} flex items-center justify-center text-white font-bold shrink-0 ${className}`}>
      {nickname[0]}
    </div>
  );
}
