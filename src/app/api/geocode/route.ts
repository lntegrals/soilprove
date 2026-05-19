import { NextRequest, NextResponse } from "next/server";
import { geocodeOneline } from "@/lib/integrations/geocode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  const result = await geocodeOneline(q);
  if (!result) {
    return NextResponse.json({ error: "No match" }, { status: 404 });
  }
  return NextResponse.json(result);
}
