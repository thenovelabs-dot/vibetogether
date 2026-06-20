import { supabase } from "../lib/supabase";
import type { ApplicationStatus } from "../types";

export interface Application {
  id: string;
  meetup_id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  email: string | null;
  status: ApplicationStatus;
  created_at: string;
}

type RawApplication = {
  id: string;
  meetup_id: string;
  user_id: string;
  status: string;
  created_at: string;
  user: { nickname: string; avatar_url: string | null; email: string | null } | null;
};

export async function applyMeetup(meetupId: string) {
  const { error } = await supabase.rpc("apply_to_meetup", { p_meetup_id: meetupId });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("meetup_closed")) throw new Error("모임이 마감됐어요");
    if (msg.includes("meetup_full")) throw new Error("정원이 찼어요");
    if (msg.includes("meetup_expired")) throw new Error("이미 지난 모임이에요");
    if (msg.includes("already_applied")) throw new Error("이미 신청한 모임이에요");
    throw error;
  }
  // fire-and-forget — 이메일 실패해도 신청은 성공으로 처리
  supabase.functions.invoke("notify-application", { body: { meetup_id: meetupId } }).catch(() => {});
}

export async function getMyApplication(
  meetupId: string,
  userId: string,
): Promise<{ id: string; status: ApplicationStatus; host_email: string | null } | null> {
  const { data } = await supabase
    .from("meetup_applications")
    .select("id, status, host_email")
    .eq("meetup_id", meetupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function getApplications(meetupId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("meetup_applications")
    .select("*, user:users!user_id(nickname, avatar_url, email)")
    .eq("meetup_id", meetupId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: RawApplication) => ({
    id: row.id,
    meetup_id: row.meetup_id,
    user_id: row.user_id,
    nickname: row.user?.nickname ?? "알 수 없음",
    avatar_url: row.user?.avatar_url ?? null,
    email: row.user?.email ?? null,
    status: row.status as ApplicationStatus,
    created_at: row.created_at,
  }));
}

export async function acceptApplication(applicationId: string): Promise<{ host_email: string }> {
  const { data, error } = await supabase.functions.invoke("accept-application", {
    body: { application_id: applicationId },
  });
  if (error) throw error;
  return data;
}


export async function cancelApplication(applicationId: string) {
  const { error } = await supabase
    .from("meetup_applications")
    .delete()
    .eq("id", applicationId);
  if (error) throw error;
}

export interface MyApplicationItem {
  id: string;
  meetup_id: string;
  meetup_title: string;
  meetup_start_at: string;
  status: ApplicationStatus;
}

export interface HostPendingItem {
  meetup_id: string;
  meetup_title: string;
  meetup_start_at: string;
  pending_count: number;
}

type MyApplicationRow = {
  id: string;
  meetup_id: string;
  status: ApplicationStatus;
  meetup: { title: string; start_at: string } | null;
};

export async function getMyApplicationsWithMeetup(userId: string): Promise<MyApplicationItem[]> {
  const { data, error } = await supabase
    .from("meetup_applications")
    .select("id, meetup_id, status, meetup:meetups!meetup_id(title, start_at)")
    .eq("user_id", userId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MyApplicationRow[]).map((row) => ({
    id: row.id,
    meetup_id: row.meetup_id,
    meetup_title: row.meetup?.title ?? "",
    meetup_start_at: row.meetup?.start_at ?? "",
    status: row.status as ApplicationStatus,
  }));
}

export async function getHostPendingItems(userId: string): Promise<HostPendingItem[]> {
  const { data: meetups, error: meetupsError } = await supabase
    .from("meetups")
    .select("id, title, start_at")
    .eq("host_id", userId)
    .eq("status", "open")
    .order("start_at", { ascending: true });

  if (meetupsError) throw meetupsError;
  if (!meetups || meetups.length === 0) return [];

  const meetupIds = meetups.map((m) => m.id);
  const { data: apps, error: appsError } = await supabase
    .from("meetup_applications")
    .select("meetup_id")
    .in("meetup_id", meetupIds)
    .eq("status", "pending");

  if (appsError) throw appsError;

  const counts: Record<string, number> = {};
  (apps ?? []).forEach((a: { meetup_id: string }) => {
    counts[a.meetup_id] = (counts[a.meetup_id] ?? 0) + 1;
  });

  return meetups
    .filter((m) => (counts[m.id] ?? 0) > 0)
    .map((m) => ({
      meetup_id: m.id,
      meetup_title: m.title,
      meetup_start_at: m.start_at,
      pending_count: counts[m.id],
    }));
}
