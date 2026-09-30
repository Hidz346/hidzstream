import { NextRequest, NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const joined = path.map(encodeURIComponent).join("/");
    const query = req.nextUrl.searchParams.toString();
    const data = await fetchSankaJson(`/comic/${joined}${query ? `?${query}` : ""}`);
    return NextResponse.json(data, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("Comic proxy:", error);
    return NextResponse.json({ error: "Comic source temporarily unavailable" }, { status: 502 });
  }
}
