import { NextRequest, NextResponse } from "next/server";

const FALLBACK = "https://placehold.co/480x720/111827/94a3b8.png?text=HidzStreaming";

function getReferer(url: string) {
  if (url.includes("manga-up.com")) return "https://global.manga-up.com/";
  if (url.includes("komiku")) return "https://komiku.org/";
  return "https://www.sankavollerei.web.id/";
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url || url === "undefined" || url === "null") {
    return NextResponse.redirect(FALLBACK);
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: getReferer(url),
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.redirect(FALLBACK);
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"
    );

    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.redirect(FALLBACK);
  }
}
