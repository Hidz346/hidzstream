import { NextRequest, NextResponse } from "next/server";

const VIDEO_PATTERNS = [
  /(?:src|file|source|url)\s*[:=]\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|webm)(?:\?[^"']*)?)["']/gi,
  /sources\s*:\s*\[\s*\{\s*(?:file|src)\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
  /player\.src\s*\(\s*\{\s*(?:src|file)\s*:\s*["'](https?:\/\/[^"']+)["']/gi,
  /video\.src\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
  /data-src\s*=\s*["'](https?:\/\/[^"']+\.(?:mp4|m3u8|webm)(?:\?[^"']*)?)["']/gi,
  /atob\(["']([A-Za-z0-9+/=]{20,})["']\)/gi,
];

function normalizeCandidate(value: string) {
  let url = value.trim();

  if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 20) {
    try {
      const decoded = Buffer.from(url, "base64").toString("utf8");
      if (decoded.startsWith("http")) url = decoded;
    } catch {}
  }

  return url;
}

function extractSources(html: string) {
  const sources: string[] = [];

  for (const pattern of VIDEO_PATTERNS) {
    for (const match of html.matchAll(pattern)) {
      const candidate = match[1] ? normalizeCandidate(match[1]) : "";
      if (candidate.startsWith("http") && !sources.includes(candidate)) {
        sources.push(candidate);
      }
    }
  }

  return sources;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Referer": "https://otakudesu.blog/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch iframe: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const sources = extractSources(html);

    const nestedFrames = [...html.matchAll(
      /<iframe[^>]+src\s*=\s*["'](https?:\/\/[^"']+)["']/gi
    )].map((match) => match[1]);

    const nestedSources: string[] = [];

    for (const nestedUrl of nestedFrames.slice(0, 3)) {
      try {
        const nestedResponse = await fetch(nestedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": url,
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!nestedResponse.ok) continue;

        const nestedHtml = await nestedResponse.text();
        for (const source of extractSources(nestedHtml)) {
          if (!nestedSources.includes(source)) nestedSources.push(source);
        }
      } catch {}
    }

    const allSources = [...sources, ...nestedSources];

    if (allSources.length > 0) {
      return NextResponse.json({
        success: true,
        sources: allSources,
        type: allSources[0].includes(".m3u8") ? "hls" : "video",
        extracted_from: url,
      });
    }

    return NextResponse.json({
      success: false,
      fallback_iframe: url,
      message: "Direct source tidak ditemukan; gunakan iframe fallback.",
    });
  } catch (error) {
    console.error("Video extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract video source" },
      { status: 502 }
    );
  }
}