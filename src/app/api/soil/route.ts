import { NextRequest, NextResponse } from "next/server";
import { fetchSsurgoProfile, fallbackProfile } from "@/lib/integrations/ssurgo";

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
    const profile = await fetchSsurgoProfile(lat, lon);
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[/api/soil] error", e);
    return NextResponse.json(fallbackProfile(lat, lon), { status: 200 });
  }
}
