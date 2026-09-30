import { NextRequest, NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get("channel") || request.nextUrl.searchParams.get("slug") || "";

  if (!channel.trim()) {
    return NextResponse.json(
      { status: false, message: "Parameter channel diperlukan" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchSankaJson(`/livetv/stream?channel=${encodeURIComponent(channel)}`);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Live TV stream:", error);
    return NextResponse.json(
      { status: false, message: "Live TV stream temporarily unavailable" },
      { status: 502 },
    );
  }
}
