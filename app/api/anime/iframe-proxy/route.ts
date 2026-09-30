import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");
  if (!targetUrl) return new NextResponse("URL parameter is required", { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://otakudesu.blog/",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return new NextResponse(`Upstream returned ${response.status}`, { status: response.status });

    const html = await response.text();
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse("Unable to load player", { status: 502 });
  }
}
