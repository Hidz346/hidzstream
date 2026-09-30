import { NextRequest, NextResponse } from "next/server";

const patterns = [
  /(?:src|file|source|url)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/gi,
  /sources\s*:\s*\[\s*\{\s*(?:file|src)\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
  /data-src\s*=\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/gi,
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://otakudesu.blog/" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return NextResponse.json({ error: `Upstream ${response.status}` }, { status: response.status });

    const html = await response.text();
    const sources: string[] = [];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        const value = match[1];
        if (value?.startsWith("http") && !sources.includes(value)) sources.push(value);
      }
    }

    return NextResponse.json({ success: sources.length > 0, sources });
  } catch (error) {
    return NextResponse.json({ error: "Extraction failed" }, { status: 502 });
  }
}
