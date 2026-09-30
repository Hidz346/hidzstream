import { NextResponse } from "next/server";
import { fetchSankaJson } from "@/lib/sanka-api";

export async function GET() {
  try {
    const data = await fetchSankaJson("/anime/donghua/home/1");
    const recent = (data.latest_release || []).map((item: any) => ({
      title: item.title,
      poster: item.poster,
      episodes: (item.current_episode || "").replace(/Ep\s*/i, "").trim(),
      animeId: item.slug,
      type: "episode",
    }));
    const completed = (data.completed_donghua || []).map((item: any) => ({
      title: item.title,
      poster: item.poster,
      episodes: "END",
      animeId: item.slug,
      type: "series",
    }));
    return NextResponse.json({ recent, completed }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Donghua home:", error);
    return NextResponse.json({ error: "Donghua source temporarily unavailable" }, { status: 502 });
  }
}
