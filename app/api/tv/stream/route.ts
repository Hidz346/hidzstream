import { NextRequest, NextResponse } from "next/server";
import { getSankaBaseUrl } from "@/lib/sanka-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json(
      { status: false, message: "Parameter slug diperlukan" },
      { status: 400 }
    );
  }

  try {
    const url = new URL(`${getSankaBaseUrl()}/livetv/stream`);
    url.searchParams.set("slug", slug);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HidzStreaming/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const payload = await response.json();

    if (!response.ok || payload?.status === false) {
      return NextResponse.json(
        { status: false, message: payload?.message || "Live TV stream unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Live TV stream:", error);

    return NextResponse.json(
      { status: false, message: "Live TV stream temporarily unavailable" },
      { status: 502 }
    );
  }
}
