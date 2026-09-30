import { NextRequest, NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const joined = path.map(encodeURIComponent).join("/");
    const query = req.nextUrl.searchParams.toString();
    const data = await fetchSankaJson(`/anime/${joined}${query ? `?${query}` : ""}`);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("Anime proxy:", error);
    return NextResponse.json({ error: "Anime source temporarily unavailable" }, { status: 502 });
  }
}
