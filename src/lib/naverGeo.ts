import { supabase } from "./supabase";
import { regionKey, NAVER_AREA1_TO_CITY } from "./regions";

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const { data, error } = await supabase.functions.invoke("naver-geocode", {
    body: { type: "reverse", lat, lng },
  });

  if (error) throw new Error("역지오코딩 실패");

  const region = data?.results?.[0]?.region;
  const area1Raw: string = region?.area1?.name ?? "";
  const area2: string = region?.area2?.name ?? "";
  const area3: string = region?.area3?.name ?? "";

  const city = NAVER_AREA1_TO_CITY[area1Raw];
  if (city && area2) return regionKey(city, area2);
  return area2 || area3 || "알 수 없는 위치";
}

export async function geocodeSearch(
  query: string
): Promise<{ name: string; lat: number; lng: number }[]> {
  const { data, error } = await supabase.functions.invoke("naver-geocode", {
    body: { type: "search", query },
  });

  if (error) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = data?.addresses ?? [];
  const seen = new Set<string>();
  return items
    .map((item) => {
      const parts = (item.jibunAddress || "").split(" ");
      const name = parts[1] || parts[2] || query;
      return { name, lat: parseFloat(item.y), lng: parseFloat(item.x) };
    })
    .filter(({ name }) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .slice(0, 5);
}

export function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 정보를 지원하지 않아요"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => {
        if (err.code === err.PERMISSION_DENIED)
          reject(new Error("위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요"));
        else
          reject(new Error("위치를 가져올 수 없어요. 다시 시도해주세요"));
      },
      { timeout: 10000 }
    );
  });
}
