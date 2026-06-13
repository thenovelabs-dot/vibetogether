import { supabase } from "../lib/supabase";

export interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export const ADMIN_EMAIL = "izzie38@gmail.com";

export async function getNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createNotice(params: { title: string; content: string }): Promise<string> {
  const { data, error } = await supabase
    .from("notices")
    .insert({ title: params.title, content: params.content })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteNotice(id: string): Promise<void> {
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw error;
}
