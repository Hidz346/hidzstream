import { NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await fetchSankaJson("/livetv/list");
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Live TV list:", error);
    return NextResponse.json(
      { status: false, message: "Live TV source temporarily unavailable" },
      { status: 502 },
    );
  }
}
