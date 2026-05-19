import { NextRequest, NextResponse } from "next/server";
import { fetchNwsForecast, fallbackWeather } from "@/lib/integrations/nws";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Invalid lat/lon" },
      { status: 400 }
    );
  }
  try {
    const weather = await fetchNwsForecast(lat, lon);
    return NextResponse.json(weather, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[/api/weather] error", e);
    return NextResponse.json(fallbackWeather(), { status: 200 });
  }
}
