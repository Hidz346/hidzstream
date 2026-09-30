import { NextResponse } from "next/server";
import { getSankaBaseUrl } from "@/lib/sanka-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch(`${getSankaBaseUrl()}/livetv/list`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "HidzStreaming/1.0",
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12000),
    });

    const payload = await response.json();

    if (!response.ok || payload?.status === false) {
      return NextResponse.json(
        { status: false, message: payload?.message || "Live TV API unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Live TV list:", error);

    return NextResponse.json(
      { status: false, message: "Live TV source temporarily unavailable" },
      { status: 502 }
    );
  }
}
