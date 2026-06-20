import { supabase } from "../lib/supabase";

export interface Meetup {
  id: string;
  host_id: string;
  host_nickname: string;
  host_avatar_url: string | null;
  title: string;
  description: string | null;
  place_name: string;
  lat: number | null;
  lng: number | null;
  start_at: string;
  capacity: number;
  region: string;
  status: "open" | "closed";
  view_count: number;
  comment_count: number;
  accepted_count: number;
  created_at: string;
}

export async function getMeetups(params?: {
  region?: string;
  sort?: "latest" | "imminent";
}): Promise<Meetup[]> {
  let query = supabase
    .from("meetups")
    .select(`
      *,
      host:users!host_id(nickname, avatar_url),
      comment_count:meetup_comments(count),
      meetup_applications(status)
    `);

  if (params?.region) {
    query = query.eq("region", params.region);
  }

  if (params?.sort === "imminent") {
    query = query.order("start_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(shapeMeetup);
}

export async function getMeetupById(id: string): Promise<Meetup | null> {
  const { data, error } = await supabase
    .from("meetups")
    .select(`
      *,
      host:users!host_id(nickname, avatar_url),
      comment_count:meetup_comments(count),
      meetup_applications(status)
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return shapeMeetup(data);
}

export async function incrementMeetupView(id: string) {
  await supabase.rpc("increment_meetup_view", { meetup_id: id });
}

export async function createMeetup(params: {
  hostId: string;
  title: string;
  description?: string;
  placeName: string;
  lat?: number;
  lng?: number;
  startAt: string;
  capacity: number;
  region: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("meetups")
    .insert({
      host_id: params.hostId,
      title: params.title,
      description: params.description ?? null,
      place_name: params.placeName,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
      start_at: params.startAt,
      capacity: params.capacity,
      region: params.region,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateMeetup(
  id: string,
  params: Partial<{
    title: string;
    description: string;
    placeName: string;
    startAt: string;
    capacity: number;
    status: "open" | "closed";
  }>,
) {
  const { error } = await supabase
    .from("meetups")
    .update({
      ...(params.title !== undefined && { title: params.title }),
      ...(params.description !== undefined && { description: params.description || null }),
      ...(params.placeName !== undefined && { place_name: params.placeName }),
      ...(params.startAt !== undefined && { start_at: params.startAt }),
      ...(params.capacity !== undefined && { capacity: params.capacity }),
      ...(params.status !== undefined && { status: params.status }),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMeetup(id: string) {
  const { error } = await supabase.from("meetups").delete().eq("id", id);
  if (error) throw error;
}

type RawMeetup = Omit<Meetup, "host_nickname" | "host_avatar_url" | "comment_count" | "accepted_count"> & {
  host: { nickname: string; avatar_url: string | null } | null;
  comment_count?: { count: number }[];
  meetup_applications?: { status: string }[];
};

function shapeMeetup(raw: RawMeetup): Meetup {
  return {
    id: raw.id,
    host_id: raw.host_id,
    host_nickname: raw.host?.nickname ?? "",
    host_avatar_url: raw.host?.avatar_url ?? null,
    title: raw.title,
    description: raw.description,
    place_name: raw.place_name,
    lat: raw.lat,
    lng: raw.lng,
    start_at: raw.start_at,
    capacity: raw.capacity,
    region: raw.region,
    status: raw.status,
    view_count: raw.view_count,
    comment_count: raw.comment_count?.[0]?.count ?? 0,
    accepted_count: (raw.meetup_applications ?? []).filter((a) => a.status === "accepted").length,
    created_at: raw.created_at,
  };
}
