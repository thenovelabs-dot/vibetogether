import { supabase } from "../lib/supabase";

export const PRODUCT_TYPES = ["앱", "웹", "앱인토스", "직접입력"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export interface ProductItem {
  id: string;
  user_id: string;
  author_nickname: string;
  author_avatar_url: string | null;
  title: string;
  short_description: string;
  detail_description: string | null;
  icon_url: string | null;
  gallery_urls: string[];
  service_url: string | null;
  sns_url: string | null;
  tags: string[];
  service_category: string;
  product_type: string;
  ai_tools: string[];
  launch_date: string | null;
  like_count: number;
  save_count: number;
  view_count: number;
  created_at: string;
  liked: boolean;
  saved: boolean;
}

export async function getShowcases(params?: {
  category?: string;
  sort?: "latest" | "popular";
  userId?: string;
}): Promise<ProductItem[]> {
  let query = supabase
    .from("products")
    .select(`
      *,
      author:users!user_id(nickname, avatar_url),
      liked:product_likes(product_id),
      saved:product_saves(product_id)
    `);

  if (params?.userId) {
    query = query
      .eq("product_likes.user_id", params.userId)
      .eq("product_saves.user_id", params.userId);
  }

  if (params?.category && params.category !== "전체") {
    query = query.eq("service_category", params.category);
  }

  query = query.order(
    params?.sort === "popular" ? "like_count" : "created_at",
    { ascending: false },
  );

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => shapeProduct(r, params?.userId));
}

export async function getShowcaseById(
  id: string,
  userId?: string,
): Promise<ProductItem | null> {
  let query = supabase
    .from("products")
    .select(`
      *,
      author:users!user_id(nickname, avatar_url),
      liked:product_likes(product_id),
      saved:product_saves(product_id)
    `)
    .eq("id", id);

  if (userId) {
    query = query
      .eq("product_likes.user_id", userId)
      .eq("product_saves.user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return shapeProduct(data, userId);
}

export async function incrementProductView(id: string) {
  await supabase.rpc("increment_product_view", { product_id: id });
}

export async function createShowcase(params: {
  userId: string;
  title: string;
  shortDescription: string;
  detailDescription?: string;
  iconUrl?: string;
  galleryUrls?: string[];
  serviceUrl?: string;
  snsUrl?: string;
  tags?: string[];
  serviceCategory: string;
  productType?: string;
  aiTools?: string[];
  launchDate?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: params.userId,
      title: params.title,
      short_description: params.shortDescription,
      detail_description: params.detailDescription ?? null,
      icon_url: params.iconUrl ?? null,
      gallery_urls: params.galleryUrls ?? [],
      service_url: params.serviceUrl ?? null,
      sns_url: params.snsUrl ?? null,
      tags: params.tags ?? [],
      service_category: params.serviceCategory,
      product_type: params.productType ?? "웹",
      ai_tools: params.aiTools ?? [],
      launch_date: params.launchDate ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateShowcase(
  id: string,
  params: Partial<{
    title: string;
    shortDescription: string;
    detailDescription: string;
    serviceUrl: string;
    snsUrl: string;
    tags: string[];
    serviceCategory: string;
    productType: string;
    aiTools: string[];
    launchDate: string;
    galleryUrls: string[];
  }>,
) {
  const { error } = await supabase
    .from("products")
    .update({
      ...(params.title !== undefined && { title: params.title }),
      ...(params.shortDescription !== undefined && { short_description: params.shortDescription }),
      ...(params.detailDescription !== undefined && { detail_description: params.detailDescription || null }),
      ...(params.serviceUrl !== undefined && { service_url: params.serviceUrl || null }),
      ...(params.snsUrl !== undefined && { sns_url: params.snsUrl || null }),
      ...(params.tags !== undefined && { tags: params.tags }),
      ...(params.serviceCategory !== undefined && { service_category: params.serviceCategory }),
      ...(params.productType !== undefined && { product_type: params.productType }),
      ...(params.aiTools !== undefined && { ai_tools: params.aiTools }),
      ...(params.launchDate !== undefined && { launch_date: params.launchDate || null }),
      ...(params.galleryUrls !== undefined && { gallery_urls: params.galleryUrls }),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteShowcase(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleLike(showcaseId: string, userId: string, isLiked: boolean) {
  if (isLiked) {
    const { error } = await supabase.from("product_likes").delete()
      .eq("product_id", showcaseId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("product_likes").insert({ product_id: showcaseId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleSave(showcaseId: string, userId: string, isSaved: boolean) {
  if (isSaved) {
    await supabase.from("product_saves").delete()
      .eq("product_id", showcaseId).eq("user_id", userId);
  } else {
    await supabase.from("product_saves").insert({ product_id: showcaseId, user_id: userId });
  }
}

type RawProduct = Record<string, unknown> & {
  id: string; user_id: string; title: string;
  short_description: string; detail_description: string | null;
  icon_url: string | null; gallery_urls: string[];
  service_url: string | null; sns_url: string | null;
  tags: string[]; service_category: string; ai_tools: string[];
  launch_date: string | null; like_count: number; save_count: number;
  view_count: number; created_at: string;
  author: { nickname: string } | null;
  liked: { product_id: string }[];
  saved: { product_id: string }[];
};

function shapeProduct(raw: RawProduct, userId?: string): ProductItem {
  return {
    id: raw.id,
    user_id: raw.user_id,
    author_nickname: raw.author?.nickname ?? "알 수 없음",
    author_avatar_url: raw.author?.avatar_url ?? null,
    title: raw.title,
    short_description: raw.short_description,
    detail_description: raw.detail_description,
    icon_url: raw.icon_url,
    gallery_urls: raw.gallery_urls ?? [],
    service_url: raw.service_url,
    sns_url: raw.sns_url,
    tags: raw.tags ?? [],
    service_category: raw.service_category,
    product_type: (raw.product_type as string) ?? "웹",
    ai_tools: raw.ai_tools ?? [],
    launch_date: raw.launch_date,
    like_count: raw.like_count,
    save_count: raw.save_count,
    view_count: raw.view_count,
    created_at: raw.created_at,
    liked: userId ? (raw.liked?.length ?? 0) > 0 : false,
    saved: userId ? (raw.saved?.length ?? 0) > 0 : false,
  };
}
