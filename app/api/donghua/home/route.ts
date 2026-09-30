import { NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export async function GET() {
  try {
    const data = await fetchSankaJson("/donghua/home");

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Donghua home:", error);

    return NextResponse.json(
      { status: false, message: "Donghua source temporarily unavailable" },
      { status: 502 }
    );
  }
}
