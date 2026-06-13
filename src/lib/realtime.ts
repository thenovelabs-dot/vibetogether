type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

/**
 * Supabase Realtime UPDATE 이벤트에서 view_count만 바뀐 경우 true 반환.
 * REPLICA IDENTITY FULL이 설정된 경우에만 old 값을 비교할 수 있음.
 * 설정되지 않은 경우 old는 PK만 포함하므로 안전하게 false 반환.
 */
export function isViewCountOnlyUpdate(payload: RealtimePayload): boolean {
  if (payload.eventType !== "UPDATE") return false;
  const old = payload.old ?? {};
  if (Object.keys(old).length <= 1) return false;
  const changed = Object.keys(old).filter((k) => old[k] !== payload.new[k]);
  return changed.length > 0 && changed.every((k) => k === "view_count");
}
