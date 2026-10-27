import { NextResponse } from "next/server";

/** Server-side Mapbox address lookup. Never send a private Mapbox key to the browser. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 5 || q.length > 160) {
    return NextResponse.json(
      { error: "Vui lòng nhập địa chỉ cụ thể (5–160 ký tự)." },
      { status: 400 },
    );
  }
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình dịch vụ tìm địa chỉ. Bạn vẫn có thể chọn cửa hàng thủ công.",
      },
      { status: 503 },
    );
  }
  const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("access_token", token);
  endpoint.searchParams.set("language", "vi");
  endpoint.searchParams.set("country", "vn");
  endpoint.searchParams.set("limit", "3");
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Geocoding upstream unavailable");
    const result = (await response.json()) as {
      features?: Array<{
        geometry?: { coordinates?: number[] };
        properties?: { full_address?: string; name?: string };
      }>;
    };
    const features = (result.features ?? []).flatMap((feature) => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [
        {
          latitude: lat,
          longitude: lng,
          label:
            feature.properties?.full_address ?? feature.properties?.name ?? q,
        },
      ];
    });
    return NextResponse.json(
      { items: features },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Không thể tìm địa chỉ lúc này. Hãy thử lại hoặc chọn cửa hàng thủ công.",
      },
      { status: 502 },
    );
  }
}
