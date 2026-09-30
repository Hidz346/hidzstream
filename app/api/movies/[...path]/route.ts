import { NextRequest, NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const joined = path.map(decodeURIComponent).join("/");
    const query = request.nextUrl.searchParams.toString();
    const data = await fetchSankaJson(`/movies/${joined}${query ? `?${query}` : ""}`);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Movies API:", error);
    return NextResponse.json({ status: false, message: "Movie source unavailable" }, { status: 502 });
  }
}