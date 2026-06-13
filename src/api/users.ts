import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  nickname: string;
  region: string;
  lat: number | null;
  lng: number | null;
  ai_tools: string[];
  job_role: string | null;
  avatar_url: string | null;
}

export async function isNicknameAvailable(nickname: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_nickname_available", { p_nickname: nickname });
  if (error) return false;
  return data === true;
}

export async function createUser(params: {
  id: string;
  nickname: string;
  region: string;
  email?: string | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const { error } = await supabase.from("users").upsert({
    id: params.id,
    nickname: params.nickname,
    region: params.region,
    email: params.email ?? null,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
  });
  if (error) throw error;
}

export async function updateUserRegion(
  userId: string,
  region: string,
  lat?: number | null,
  lng?: number | null,
) {
  const { error } = await supabase
    .from("users")
    .update({ region, ...(lat !== undefined ? { lat, lng } : {}) })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateUserAITools(userId: string, aiTools: string[]) {
  const { error } = await supabase
    .from("users")
    .update({ ai_tools: aiTools })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateUserJobRole(userId: string, jobRole: string) {
  const { error } = await supabase
    .from("users")
    .update({ job_role: jobRole })
    .eq("id", userId);
  if (error) throw error;
}

export async function getUserByNickname(nickname: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("users")
    .select("id, nickname, region, lat, lng, ai_tools, job_role, avatar_url, created_at")
    .eq("nickname", nickname)
    .maybeSingle();
  return data ?? null;
}

export async function getMyMeetups(userId: string) {
  const { data, error } = await supabase
    .from("meetups")
    .select("id, title, place_name, start_at, created_at")
    .eq("host_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCommentedMeetups(userId: string) {
  const { data, error } = await supabase
    .from("meetup_comments")
    .select("meetup:meetups(id, title, place_name, start_at, created_at)")
    .eq("user_id", userId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  return (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => row.meetup)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => {
      if (!m || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
}

export async function getMyApplications(userId: string) {
  const { data, error } = await supabase
    .from("meetup_applications")
    .select("id, status, host_email, created_at, meetup:meetups(id, title, place_name, start_at)")
    .eq("user_id", userId)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyProducts(userId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateUserNickname(userId: string, nickname: string) {
  const { error } = await supabase.from("users").update({ nickname }).eq("id", userId);
  if (error) throw error;
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function updateUserAvatar(userId: string, avatarUrl: string | null) {
  const { error } = await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", userId);
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.functions.invoke("delete-account");
  if (error) throw error;
}
