import crypto from "node:crypto";
import { load } from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151 Safari/537.36";

const ANIMASU = "https://animasu.love";
const SAMEHADAKU = "https://samehadaku.li";
const ANICHIN = "https://anichin.ro";
const MANGA_UP = "https://global.manga-up.com";
const MANGA_API = "https://global-api.manga-up.com";
const CUBMU = "https://www.cubmu.com";
const TRANSVISION = "https://servicebuss.transvision.co.id/global";

type AnyRecord = Record<string, any>;

async function fetchText(url: string, init: RequestInit = {}, timeout = 15000) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url: string, init: RequestInit = {}, timeout = 15000) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function abs(base: string, value?: string) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function decodeEntities(value: string) {
  return value
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function b64(value: string) {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
}

function unique<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

async function resolveVidhide(url: string, referer: string) {
  try {
    const html = await fetchText(url, { headers: { Referer: referer } }, 10000);
    const candidates = [
      ...html.matchAll(/https?:\\/\\/[^\\s"'<>]+\\.m3u8[^\\s"'<>]*/gi),
      ...html.matchAll(/(?:file|src|source|url)\\s*[:=]\\s*["'](https?:\\/\\/[^"']+)["']/gi),
    ]
      .map((match) => match[1] || match[0])
      .filter((value) => /\\.m3u8(?:$|[?#])/i.test(value));

    return candidates[0] || null;
  } catch {
    return null;
  }
}

async function resolveOk(url: string, referer: string) {
  try {
    const html = await fetchText(url, { headers: { Referer: referer } }, 10000);
    const match = html.match(/data-options=["']([^"']+)["']/i);
    if (!match) return null;

    const options = JSON.parse(decodeEntities(match[1]));
    const metadata = options?.flashvars?.metadata;
    const json = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
    const videos = Array.isArray(json?.videos) ? json.videos : [];

    for (const quality of ["hd", "sd", "full", "low", "mobile", "lowest"]) {
      const found = videos.find(
        (item: AnyRecord) =>
          String(item?.name || "").toLowerCase() === quality &&
          String(item?.url || "").startsWith("http"),
      );
      if (found?.url) return found.url;
    }

    return (
      json?.hlsManifestUrl ||
      videos.find((item: AnyRecord) => String(item?.url || "").startsWith("http"))
        ?.url ||
      null
    );
  } catch {
    return null;
  }
}

async function resolveTurbo(url: string, referer: string) {
  try {
    const html = await fetchText(url, { headers: { Referer: referer } }, 10000);
    return (
      html.match(/https?:\/\/[^\s"']+\.m3u8[^"']*/i)?.[0] ||
      html.match(/file:\s*["']([^"']+\.m3u8[^"']*)["']/i)?.[1] ||
      null
    );
  } catch {
    return null;
  }
}

async function resolveYourUpload(url: string, referer: string) {
  try {
    const html = await fetchText(url, { headers: { Referer: referer } }, 10000);
    return (
      html.match(/file:\s*["']([^"']+\.mp4[^"']*)["']/i)?.[1] ||
      html.match(/property=["']og:video["']\s+content=["']([^"']+)["']/i)?.[1] ||
      null
    );
  } catch {
    return null;
  }
}

async function resolveDirect(url: string, referer: string) {
  const clean = decodeEntities(url.trim());
  if (!clean) return null;
  if (/\.(m3u8|mp4|webm|mpd)(?:$|[?#])/i.test(clean)) return clean;
  if (/googlevideo\.com/i.test(clean)) return clean;
  if (/ok\.ru\/videoembed\//i.test(clean)) return resolveOk(clean, referer);
  if (/vidhide|odvidhide/i.test(clean)) return resolveVidhide(clean, referer);
  if (/turbovidhls\.com|turbovid/i.test(clean)) return resolveTurbo(clean, referer);
  if (/yourupload\.com/i.test(clean)) return resolveYourUpload(clean, referer);
  return null;
}

function parseCards(html: string, base: string, badge: string) {
  const $ = load(html);
  const items = $(".bsx, article.bs, .animepost, .animpost, .listupd article, .film-poster-ahref")
    .map((_, el) => {
      const a = $(el).find("a").first();
      const href = abs(base, a.attr("href") || "");
      const title =
        $(el).find(".tt").first().text().trim() ||
        $(el).find(".title, h2, h4").first().text().trim() ||
        a.attr("title") ||
        "";
      if (!href || !title) return null;

      const img = $(el).find("img").first();
      return {
        title,
        thumbnail: abs(
          base,
          img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "",
        ),
        url: href,
        slug: href.replace(/\/$/, "").split("/").pop() || "",
        episode: $(el).find(".epx").first().text().trim() || null,
        type: $(el).find(".typez").first().text().trim() || null,
        status: $(el).find(".status").first().text().trim() || null,
        badge,
      };
    })
    .get()
    .filter(Boolean) as AnyRecord[];

  return unique(items, (item) => item.url);
}

async function animeLatest(page = 1) {
  try {
    const url = page > 1 ? `${ANIMASU}/page/${page}/` : `${ANIMASU}/`;
    return { status: true, data: parseCards(await fetchText(url), ANIMASU, "Anime") };
  } catch {
    const url = page > 1 ? `${SAMEHADAKU}/page/${page}/` : `${SAMEHADAKU}/`;
    return { status: true, data: parseCards(await fetchText(url), SAMEHADAKU, "Anime") };
  }
}

async function animeSearch(query: string, page = 1) {
  const q = encodeURIComponent(query);
  try {
    const url = page > 1 ? `${ANIMASU}/page/${page}/?s=${q}` : `${ANIMASU}/?s=${q}`;
    return { status: true, data: parseCards(await fetchText(url), ANIMASU, "Anime") };
  } catch {
    const url = page > 1 ? `${SAMEHADAKU}/page/${page}/?s=${q}` : `${SAMEHADAKU}/?s=${q}`;
    return { status: true, data: parseCards(await fetchText(url), SAMEHADAKU, "Anime") };
  }
}

async function animeDetail(idOrUrl: string) {
  const candidates = idOrUrl.startsWith("http")
    ? [idOrUrl]
    : [`${ANIMASU}/anime/${idOrUrl.replace(/^\/+/, "")}/`, `${SAMEHADAKU}/anime/${idOrUrl.replace(/^\/+/, "")}/`];

  let lastError: unknown = null;

  for (const target of candidates) {
    try {
      const html = await fetchText(target);
      const $ = load(html);
      const title =
        $("h1.entry-title").first().text().trim() || $("h1").first().text().trim();
      if (!title) throw new Error("Anime tidak ditemukan");

      const thumbnail = abs(
        target.includes("animasu") ? ANIMASU : SAMEHADAKU,
        $(".thumb img").attr("data-src") ||
          $(".thumb img").attr("data-lazy-src") ||
          $(".thumb img").attr("src") ||
          "",
      );

      const synopsis = $(".entry-content, .desc, .synopsis").first().text().trim();
      const episodes: AnyRecord[] = [];

      $(".bxcl ul li, .eplister li, .episodelist ul li").each((index, li) => {
        const a = $(li).find("a").first();
        const href = abs(
          target.includes("animasu") ? ANIMASU : SAMEHADAKU,
          a.attr("href") || "",
        );
        if (!href) return;

        const label =
          $(li).find(".epl-title").text().trim() ||
          a.text().trim() ||
          `Episode ${index + 1}`;

        episodes.push({
          episode: $(li).find(".epl-num").text().trim() || String(index + 1),
          title: label,
          date: $(li).find(".epl-date, .dt, .date").first().text().trim() || null,
          url: href,
        });
      });

      if (!episodes.length) {
        $("a[href*='-episode-']").each((index, a) => {
          const href = abs(
            target.includes("animasu") ? ANIMASU : SAMEHADAKU,
            $(a).attr("href") || "",
          );
          if (!href) return;
          const label = $(a).text().trim() || `Episode ${index + 1}`;
          episodes.push({
            episode: /\d+/.exec(label)?.[0] || String(index + 1),
            title: label,
            url: href,
          });
        });
      }

      return {
        status: true,
        data: {
          title,
          thumbnail,
          synopsis: synopsis || null,
          rating: $(".rating strong, .rating .num").first().text().trim() || null,
          genres: $("a[href*='/genre/'], a[href*='/genres/'], .genxed a")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(Boolean),
          episodes: unique(episodes, (item) => item.url),
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Anime detail failed");
}

async function animeStream(url: string) {
  const base = url.includes("samehadaku") ? SAMEHADAKU : ANIMASU;
  const html = await fetchText(url, { headers: { Referer: `${base}/` } });
  const $ = load(html);
  const title = $("h1.entry-title, h1").first().text().trim() || "Episode";
  const mirrors: AnyRecord[] = [];

  $("select.mirror option, .mirror option").each((index, option) => {
    const raw = $(option).attr("value") || "";
    const label = $(option).text().trim();
    if (!raw || raw.length < 8) return;

    const decoded = b64(raw);
    const src =
      load(decoded)("iframe").attr("src") ||
      decoded.match(/src=["']([^"']+)["']/i)?.[1] ||
      "";

    if (!src) return;

    mirrors.push({
      name: label || `Server ${index + 1}`,
      url: decodeEntities(src)
        .replace("short.ink", "player.abyssplayer.com")
        .replace("short.icu", "player.abyssplayer.com")
        .replace("uservideo.in", "uservideo.xyz")
        .replace("nanime.yt", "nanime.in"),
    });
  });

  $("#pembed iframe, .player-embed iframe, iframe").each((_, iframe) => {
    const src =
      $(iframe).attr("data-litespeed-src") ||
      $(iframe).attr("data-src") ||
      $(iframe).attr("src") ||
      "";
    if (src && src !== "about:blank") mirrors.unshift({ name: "Default", url: decodeEntities(src) });
  });

  const sources: AnyRecord[] = [];
  for (const mirror of unique(mirrors, (item) => item.url).slice(0, 10)) {
    const direct = await resolveDirect(mirror.url, `${base}/`);
    sources.push({
      name: direct ? `${mirror.name} • Direct` : mirror.name,
      url: direct || mirror.url,
      kind: direct ? (/\.m3u8/i.test(direct) ? "hls" : "video") : "iframe",
    });
  }

  return {
    status: true,
    data: {
      title,
      streams: unique(sources, (item) => item.url),
      streamUrl: sources.find((item) => item.kind !== "iframe")?.url || null,
      iframe: sources.find((item) => item.kind === "iframe")?.url || null,
    },
  };
}

async function donghuaLatest(page = 1) {
  const url = page > 1 ? `${ANICHIN}/page/${page}/` : `${ANICHIN}/`;
  return { status: true, data: parseCards(await fetchText(url), ANICHIN, "Donghua") };
}

async function donghuaSearch(query: string, page = 1) {
  const url = page > 1
    ? `${ANICHIN}/page/${page}/?s=${encodeURIComponent(query)}`
    : `${ANICHIN}/?s=${encodeURIComponent(query)}`;
  return { status: true, data: parseCards(await fetchText(url), ANICHIN, "Donghua") };
}

async function donghuaDetail(idOrUrl: string) {
  const target = idOrUrl.startsWith("http") ? idOrUrl : `${ANICHIN}/${idOrUrl.replace(/^\/+/, "")}/`;
  const html = await fetchText(target);
  const $ = load(html);
  const title = $("h1.entry-title, h1").first().text().trim();
  const episodes: AnyRecord[] = [];

  $(".episodes-ul a, .block_area-content a[href*='episode'], .eplister li a").each((index, a) => {
    const href = abs(ANICHIN, $(a).attr("href") || "");
    if (!href) return;
    const label = $(a).text().trim() || `Episode ${index + 1}`;
    episodes.push({
      episode: /\d+/.exec(label)?.[0] || String(index + 1),
      title: label,
      url: href,
    });
  });

  return {
    status: true,
    data: {
      title,
      thumbnail: abs(
        ANICHIN,
        $(".thumb img").attr("data-src") || $(".thumb img").attr("src") || "",
      ),
      synopsis: $(".entry-content, .desc, .synopsis").first().text().trim() || null,
      episodes: unique(episodes, (item) => item.url),
    },
  };
}

async function donghuaStream(url: string) {
  const html = await fetchText(url, { headers: { Referer: `${ANICHIN}/` } });
  const $ = load(html);
  const title = $("h1.entry-title, h1").first().text().trim() || "Donghua Episode";
  const mirrors: AnyRecord[] = [];

  $("iframe, a[data-hash], .server-item a, ul.mirror li a, select.mirror option, #servers-content a").each((index, el) => {
    const directSrc =
      $(el).attr("data-litespeed-src") ||
      $(el).attr("data-src") ||
      $(el).attr("src") ||
      "";

    const raw =
      $(el).attr("data-hash") ||
      $(el).attr("data-video") ||
      $(el).attr("value") ||
      directSrc;

    if (!raw) return;

    const decoded = raw.length > 20 ? b64(raw) || raw : raw;
    const src =
      directSrc ||
      load(decoded)("iframe").attr("src") ||
      decoded.match(/src=["']([^"']+)["']/i)?.[1] ||
      decoded;

    if (/^https?:\/\//i.test(src)) {
      mirrors.push({
        name: $(el).text().trim() || `Server ${index + 1}`,
        url: decodeEntities(src),
      });
    }
  });

  const streams = [];
  for (const mirror of unique(mirrors, (item) => item.url).slice(0, 10)) {
    const direct = await resolveDirect(mirror.url, `${ANICHIN}/`);
    streams.push({
      name: direct ? `${mirror.name} • Direct` : mirror.name,
      url: direct || mirror.url,
      kind: direct ? (/\.m3u8/i.test(direct) ? "hls" : "video") : "iframe",
    });
  }

  return {
    status: true,
    data: {
      title,
      streams: unique(streams, (item) => item.url),
      servers: unique(streams, (item) => item.url),
      streamUrl: streams.find((item) => item.kind !== "iframe")?.url || null,
      iframe: streams.find((item) => item.kind === "iframe")?.url || null,
    },
  };
}

function parseProto(data: Buffer) {
  let offset = 0;
  const result: Record<number, AnyRecord[]> = {};

  while (offset < data.length) {
    let key = 0;
    let shift = 0;

    while (offset < data.length) {
      const byte = data[offset++];
      key |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    const field = key >> 3;
    const wire = key & 7;

    if (wire === 0) {
      let value = 0;
      shift = 0;

      while (offset < data.length) {
        const byte = data[offset++];
        value |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }

      (result[field] ||= []).push({ type: "varint", val: value });
    } else if (wire === 2) {
      let length = 0;
      shift = 0;

      while (offset < data.length) {
        const byte = data[offset++];
        length |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }

      const value = data.subarray(offset, offset + length);
      offset += length;
      (result[field] ||= []).push({ type: "bytes", val: value });
    } else if (wire === 1) {
      const value = data.subarray(offset, offset + 8);
      offset += 8;
      (result[field] ||= []).push({ type: "64bit", val: value });
    } else if (wire === 5) {
      const value = data.subarray(offset, offset + 4);
      offset += 4;
      (result[field] ||= []).push({ type: "32bit", val: value });
    } else {
      break;
    }
  }

  return result;
}

async function mangaHome() {
  const html = await fetchText(`${MANGA_UP}/`);
  const $ = load(html);
  const raw = $("#__NEXT_DATA__").html();
  if (!raw) throw new Error("Manga UP bootstrap unavailable");

  const data = JSON.parse(raw)?.props?.pageProps?.data || {};
  const lists = [...(data.updatedTitles || []), ...(data.newTitles || []), ...(data.rankings || [])];

  return {
    status: true,
    data: unique(
      lists.map((item: AnyRecord) => ({
        id: item.titleId,
        title: item.titleName,
        thumbnail: item.imageUrl ? abs(MANGA_API, item.imageUrl) : null,
        badge: "Manga",
      })),
      (item) => String(item.id),
    ),
  };
}

async function mangaDetail(id: string) {
  const clean = id.match(/\/manga\/(\d+)/)?.[1] || id;
  const html = await fetchText(`${MANGA_UP}/manga/${clean}`);
  const $ = load(html);
  const raw = $("#__NEXT_DATA__").html();
  if (!raw) throw new Error("Manga UP detail unavailable");

  const data = JSON.parse(raw)?.props?.pageProps?.data;
  if (!data) throw new Error("Manga tidak ditemukan");

  return {
    status: true,
    data: {
      id: Number(clean),
      title: data.titleName,
      author: data.authorName || null,
      description: data.description || "",
      thumbnail: data.imageUrl ? abs(MANGA_API, data.imageUrl) : null,
      tags: (data.tags || []).map((item: AnyRecord) => item.name || item),
      chapters: (data.chapters || []).map((chapter: AnyRecord) => ({
        id: chapter.id,
        title: chapter.subName ? `${chapter.mainName} - ${chapter.subName}` : chapter.mainName,
        thumbnail: chapter.imageUrl ? abs(MANGA_API, chapter.imageUrl) : null,
        isFree: chapter.consumptionType === 3 || chapter.price === null || chapter.price === 0,
        price: chapter.price || 0,
      })),
    },
  };
}

async function mangaSearch(query: string) {
  const response = await fetch(
    `${MANGA_API}/api/manga/search?word=${encodeURIComponent(query)}&lang=en`,
    {
      headers: {
        "User-Agent": UA,
        Origin: MANGA_UP,
        Referer: `${MANGA_UP}/`,
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  const parsed = parseProto(Buffer.from(await response.arrayBuffer()));
  const rawTitles = parsed[1] || [];

  const data = rawTitles.map((item) => {
    const sub = parseProto(item.val);
    const titleId = sub[1]?.[0]?.val;
    const title = sub[2]?.[0]?.val ? Buffer.from(sub[2][0].val).toString("utf8") : "";
    const image = sub[3]?.[0]?.val ? Buffer.from(sub[3][0].val).toString("utf8") : "";
    return {
      id: titleId,
      title,
      thumbnail: image ? abs(MANGA_API, image) : null,
      badge: "Manga",
    };
  }).filter((item) => item.id && item.title);

  return { status: true, data };
}

async function mangaRead(chapterId: string) {
  const response = await fetch(
    `${MANGA_API}/api/manga/viewer_v2?chapter_id=${encodeURIComponent(chapterId)}&first=yes&quality=high&lang=en`,
    {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Origin: MANGA_UP,
        Referer: `${MANGA_UP}/`,
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: AbortSignal.timeout(15000),
    },
  );

  if (response.status === 401) {
    throw new Error("Chapter ini berbayar atau membutuhkan login akun Manga UP");
  }
  if (!response.ok) throw new Error(`Manga UP HTTP ${response.status}`);

  const top = parseProto(Buffer.from(await response.arrayBuffer()));
  const blockRaw = top[3]?.[0]?.val;
  if (!blockRaw) throw new Error("Data halaman chapter tidak ditemukan");

  const block = parseProto(blockRaw);
  const title = block[2]?.[0]?.val
    ? Buffer.from(block[2][0].val).toString("utf8")
    : "";

  const pages = (block[3] || []).map((page, index) => {
    const p = parseProto(page.val);
    const url = p[1]?.[0]?.val ? Buffer.from(p[1][0].val).toString("utf8") : "";
    const key = p[5]?.[0]?.val ? Buffer.from(p[5][0].val).toString("utf8") : "";
    const iv = p[6]?.[0]?.val ? Buffer.from(p[6][0].val).toString("utf8") : "";

    return {
      page: index + 1,
      url: url ? abs(MANGA_API, url) : null,
      key: key || null,
      iv: iv || null,
    };
  }).filter((item) => item.url);

  return {
    status: true,
    data: {
      title,
      chapterId: Number(chapterId),
      pages,
      images: pages,
      totalPages: pages.length,
    },
  };
}

async function liveTvList() {
  const fallback = [
    { id: "210", name: "Trans TV HD", number: "7", slug: "210-trans-tv", image: "https://servicebuss.transvision.co.id/uploads/channel/logo/210.png", isWatchable: true },
    { id: "211", name: "Trans7 HD", number: "8", slug: "211-trans7", image: "https://servicebuss.transvision.co.id/uploads/channel/logo/211.png", isWatchable: true },
    { id: "214", name: "CNN Indonesia", number: "804", slug: "214-cnn-indonesia", image: "https://servicebuss.transvision.co.id/uploads/channel/logo/214.png", isWatchable: true },
  ];

  try {
    if (!process.env.CUBMU_CHANNEL_TOKEN) {
      return { status: true, data: { totalChannels: fallback.length, genres: [{ genreName: "Nasional", channels: fallback }] } };
    }

    const json = await fetchJson(
      `${TRANSVISION}/v4/channel-list?page=1&per_page=50&platform_id=1`,
      { headers: { Authorization: `Bearer ${process.env.CUBMU_CHANNEL_TOKEN}`, Origin: CUBMU, Referer: `${CUBMU}/` } },
    );

    const groups = (json?.data?.items || []).map((group: AnyRecord) => ({
      genreId: group.genre_id,
      genreName: group.genre_name,
      channels: (group.channels || []).map((channel: AnyRecord) => ({
        id: channel.channel_id,
        name: channel.channel_name,
        number: channel.channel_number,
        image: channel.channel_image || channel.channel_ott_image || null,
        slug: `${channel.channel_id}-${String(channel.channel_name || "").trim().toLowerCase().replace(/\s+/g, "-")}`,
        isWatchable: channel.is_watchable_channel !== false,
      })),
    }));

    return {
      status: true,
      data: {
        totalChannels: groups.reduce((sum: number, group: AnyRecord) => sum + group.channels.length, 0),
        genres: groups,
      },
    };
  } catch {
    return { status: true, data: { totalChannels: fallback.length, genres: [{ genreName: "Nasional", channels: fallback }] } };
  }
}

async function liveTvStream(channel: string) {
  const slug = channel.includes("/live-tv/")
    ? channel.match(/\/live-tv\/([^/?#]+)/)?.[1] || channel
    : channel;

  const html = await fetchText(`${CUBMU}/watch/live-tv/${slug}`, { headers: { Referer: `${CUBMU}/` } });
  const $ = load(html);
  const raw = $("#__NEXT_DATA__").html();
  if (!raw) throw new Error("CubMu player data unavailable");

  const page = JSON.parse(raw)?.props?.pageProps || {};
  const detail = page.detailChannel;
  const candidates: string[] = [];

  if (typeof page.manifest === "string" && page.manifest.startsWith("http")) {
    candidates.push(page.manifest);
  }

  for (const cdn of detail?.channel_cdn_list || []) {
    for (const value of [cdn?.cdn_manifest?.hls, cdn?.cdn_manifest?.global]) {
      if (typeof value === "string" && value.startsWith("http")) candidates.push(value);
    }
  }

  return {
    status: true,
    data: {
      title: detail?.channel_name || slug,
      streamUrl: candidates[0] || null,
      streams: candidates.map((url, index) => ({
        name: index === 0 ? "CubMu Direct" : `CubMu CDN ${index + 1}`,
        url,
        kind: /\.m3u8/i.test(url) ? "hls" : "video",
      })),
    },
  };
}



const MOVIEBOX = "https://themoviebox.xyz/id";
const MOVIE_API = "https://h5-api.aoneroom.com/wefeed-h5api-bff";
const DRACINEMA = "https://www.dracinema.com";

async function movieLatest(page = 1) {
  const json = await fetchJson(
    `${MOVIE_API}/subject/trending?page=${page}&perPage=20`,
    {
      headers: {
        "X-Request-Lang": "id",
        Origin: MOVIEBOX,
        Referer: `${MOVIEBOX}/`,
      },
    },
  );

  const list = json?.data?.subjectList || json?.data?.items || [];

  return {
    status: true,
    data: list.map((item: AnyRecord) => ({
      id: item.detailPath,
      slug: item.detailPath,
      title: item.title,
      thumbnail: item.cover?.url || null,
      rating: item.imdbRatingValue || "7.8",
      year: String(item.releaseDate || "").slice(0, 4),
      badge: item.subjectType === 2 ? "Series" : "Movie",
      url: `${MOVIEBOX}/detail/${item.detailPath}`,
    })),
  };
}

async function movieDetail(urlOrPath: string) {
  const cleanPath = urlOrPath
    .replace(MOVIEBOX, "")
    .replace(/^\/id\/detail\//, "")
    .replace(/^\/detail\//, "")
    .replace(/^\/id\//, "")
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "");

  const json = await fetchJson(
    `${MOVIE_API}/detail?detailPath=${encodeURIComponent(cleanPath)}`,
    {
      headers: {
        "X-Request-Lang": "id",
        Origin: MOVIEBOX,
        Referer: `${MOVIEBOX}/`,
      },
    },
  );

  const data = json?.data;
  const subject = data?.subject;
  const resource = data?.resource;
  if (!subject) throw new Error("Movie detail tidak ditemukan");

  const isMovie = subject.subjectType === 1;
  const episodes: AnyRecord[] = [];

  if (isMovie) {
    episodes.push({
      id: `${cleanPath}?se=0&ep=0&subId=${subject.subjectId}`,
      episode: "1",
      title: "Full Movie",
      url: `${cleanPath}?se=0&ep=0&subId=${subject.subjectId}`,
    });
  } else {
    for (const season of resource?.seasons || []) {
      const se = Number(season.se || 1);
      const values = season.allEp
        ? String(season.allEp).split(",").map((item: string) => Number(item)).filter(Boolean)
        : Array.from({ length: Number(season.maxEp) || 1 }, (_, i) => i + 1);

      for (const ep of values) {
        episodes.push({
          id: `${cleanPath}?se=${se}&ep=${ep}&subId=${subject.subjectId}`,
          episode: String(ep),
          title: `S${se} Episode ${ep}`,
          url: `${cleanPath}?se=${se}&ep=${ep}&subId=${subject.subjectId}`,
        });
      }
    }
  }

  return {
    status: true,
    data: {
      title: subject.title,
      thumbnail: subject.cover?.url || null,
      backdrop: subject.stills?.url || subject.cover?.url || null,
      synopsis: subject.description || null,
      rating: subject.imdbRatingValue || "7.8",
      year: String(subject.releaseDate || "").slice(0, 4),
      episodes,
    },
  };
}

async function getMovieToken() {
  for (const detailPath of [
    "lucifer-indonesian-YwF1Ii2H3B5",
    "avatar-WLDIi21IUBa",
    "the-furious-6lxRH1LLAe5",
  ]) {
    try {
      const response = await fetch(
        `${MOVIE_API}/detail?detailPath=${encodeURIComponent(detailPath)}`,
        {
          headers: {
            "User-Agent": UA,
            Accept: "application/json",
            "X-Request-Lang": "id",
            Origin: MOVIEBOX,
            Referer: `${MOVIEBOX}/`,
          },
          signal: AbortSignal.timeout(10000),
        },
      );

      const xUser = response.headers.get("x-user");
      if (xUser) {
        try {
          const parsed = JSON.parse(xUser);
          if (parsed?.token) return String(parsed.token);
        } catch {
          // Ignore malformed token headers.
        }
      }

      const cookies = response.headers.get("set-cookie") || "";
      const match = cookies.match(/token=([^;]+)/i);
      if (match?.[1]) return match[1];
    } catch {
      // Try the next bootstrap path.
    }
  }

  return "";
}

async function movieStream(urlOrPath: string, episode = 1) {
  const detail = await movieDetail(urlOrPath);
  const query = new URLSearchParams(urlOrPath.split("?")[1] || "");
  const cleanPath = urlOrPath
    .replace(MOVIEBOX, "")
    .replace(/^\/id\/detail\//, "")
    .replace(/^\/detail\//, "")
    .replace(/^\/id\//, "")
    .split("?")[0]
    .replace(/^\/+|\/+$/g, "");

  const se = Number(query.get("se") || (detail.data.episodes.length ? 1 : 0));
  const ep = Number(query.get("ep") || episode);
  const subId =
    query.get("subId") ||
    detail.data.episodes[0]?.url.match(/subId=([^&]+)/)?.[1] ||
    "";

  const token = await getMovieToken();

  async function play(season: number, number: number) {
    const url =
      `${MOVIE_API}/subject/play?subjectId=${encodeURIComponent(subId)}&se=${season}&ep=${number}&detailPath=${encodeURIComponent(cleanPath)}&streamSignType=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "X-Request-Lang": "id",
        Origin: MOVIEBOX,
        Referer: `${MOVIEBOX}/spa/videoPlayPage/movies/${cleanPath}`,
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
              Cookie: `token=${token}; mb_token="${token}"`,
            }
          : {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    return response.ok ? response.json() : null;
  }

  let payload = await play(se, ep);
  let streams = payload?.data?.streams || [];
  let hls = payload?.data?.hls || [];

  if (!streams.length && !hls.length) {
    payload = await play(0, 0);
    streams = payload?.data?.streams || [];
    hls = payload?.data?.hls || [];
  }

  if (!streams.length && !hls.length) {
    payload = await play(1, 1);
    streams = payload?.data?.streams || [];
    hls = payload?.data?.hls || [];
  }

  const servers = [
    ...streams.map((item: AnyRecord) => ({
      name: `TheMovieBox ${item.resolutions || "HD"}`,
      url: item.url,
      kind: /\.m3u8/i.test(String(item.url || "")) ? "hls" : "video",
    })),
    ...hls.map((item: AnyRecord) => ({
      name: "TheMovieBox HLS",
      url: item.url,
      kind: "hls",
    })),
  ].filter((item: AnyRecord) => item.url);

  return {
    status: true,
    data: {
      title: detail.data.title,
      streamUrl: servers[0]?.url || null,
      servers,
    },
  };
}

async function dracinLatest(page = 1) {
  const html = await fetchText(`${DRACINEMA}/collections?page=${page}`);
  const $ = load(html);
  const data: AnyRecord[] = [];

  $("a[href^='/movie/']").each((_, a) => {
    const href = $(a).attr("href") || "";
    const slug = href.replace(/^\/movie\//, "").replace(/\/$/, "");
    if (!slug || data.some((item) => item.slug === slug)) return;

    const image = $(a).find("img").first();
    const title = String(image.attr("alt") || $(a).text())
      .replace(/Full Episode Subtitle Indonesia - Dracinema/i, "")
      .replace(/Subtitle Indonesia/i, "")
      .replace(/- Dracinema/i, "")
      .trim();

    if (title) {
      data.push({
        id: `${DRACINEMA}/movie/${slug}`,
        title,
        slug,
        url: `${DRACINEMA}/movie/${slug}`,
        thumbnail: abs(DRACINEMA, image.attr("src") || image.attr("data-src") || ""),
        badge: "Sub Indo",
      });
    }
  });

  return { status: true, data };
}

async function dracinDetail(urlOrSlug: string) {
  const slug = urlOrSlug
    .replace(DRACINEMA, "")
    .replace(/^\/movie\//, "")
    .replace(/^\/play\//, "")
    .split("/")[0];

  const html = await fetchText(`${DRACINEMA}/movie/${slug}`);
  const $ = load(html);
  const title = $("h1").first().text().trim() || $("title").first().text().trim();
  const poster =
    $("meta[property='og:image']").attr("content") ||
    $("img").first().attr("src") ||
    "";
  const synopsis =
    $("meta[property='og:description']").attr("content") ||
    $("p.text-sm, p.description").first().text().trim() ||
    "";

  let total = 1;
  $("a[href*='/play/']").each((_, a) => {
    const match = $(a).attr("href")?.match(/\/play\/[^/]+\/(\d+)/);
    if (match) total = Math.max(total, Number(match[1]) || 1);
  });

  const range = html.match(/Episode\s+(\d+)\s*-\s*(\d+)/i);
  if (range) total = Math.max(total, Number(range[2]) || total);

  return {
    status: true,
    data: {
      title,
      thumbnail: poster,
      synopsis,
      episodes: Array.from({ length: total }, (_, index) => ({
        id: `${DRACINEMA}/play/${slug}/${index + 1}`,
        episode: String(index + 1),
        title: `Episode ${index + 1}`,
        url: `${DRACINEMA}/play/${slug}/${index + 1}`,
      })),
    },
  };
}

async function dracinStream(urlOrSlug: string, episode = 1) {
  const key = process.env.DRACINEMA_API_KEY;
  if (!key) throw new Error("DRACINEMA_API_KEY belum dikonfigurasi");

  const slug = urlOrSlug
    .replace(DRACINEMA, "")
    .replace(/^\/movie\//, "")
    .replace(/^\/play\//, "")
    .split("/")[0];

  const payload = await fetchJson(
    `${DRACINEMA}/api/playback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
        Referer: `${DRACINEMA}/play/${slug}/${Math.max(1, episode)}`,
      },
      body: JSON.stringify({ movieKey: slug, episode: Math.max(1, episode) }),
    },
  );

  const token = String(payload?.token || "");
  let direct = "";

  if (token.split(".").length >= 2) {
    const body = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = body + "=".repeat((4 - (body.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    direct = decoded?.data?.detail?.videoUrls?.[0]?.url || "";
  }

  return {
    status: true,
    data: {
      streamUrl: direct || null,
      servers: direct ? [{ name: "Dracinema Direct", url: direct, kind: "video" }] : [],
    },
  };
}
export async function fetchApkJson(path: string, search = new URLSearchParams()) {
  const clean = path.replace(/^\/+/, "");
  const parts = clean.split("/").filter(Boolean);

  if (parts[0] === "anime" && parts[1] === "animasu") {
    if (parts[2] === "home") return animeLatest(Number(search.get("page") || 1));
    if (parts[2] === "search") return animeSearch(decodeURIComponent(parts.slice(3).join("/")), Number(search.get("page") || 1));
    if (parts[2] === "detail") return animeDetail(decodeURIComponent(parts.slice(3).join("/")));
    if (parts[2] === "episode") return animeStream(decodeURIComponent(parts.slice(3).join("/")));
  }

  if (parts[0] === "comic") {
    if (parts[1] === "homepage") return mangaHome();
    if (parts[1] === "search") return mangaSearch(decodeURIComponent(parts.slice(2).join("/")));
    if (parts[1] === "comic") return mangaDetail(decodeURIComponent(parts.slice(2).join("/")));
    if (parts[1] === "chapter") return mangaRead(decodeURIComponent(parts.slice(2).join("/")));
  }

  if (parts[0] === "donghua") {
    if (parts[1] === "home") return donghuaLatest(Number(search.get("page") || 1));
    if (parts[1] === "search") return donghuaSearch(decodeURIComponent(parts.slice(2).join("/")), Number(search.get("page") || 1));
    if (parts[1] === "detail") return donghuaDetail(decodeURIComponent(parts.slice(2).join("/")));
    if (parts[1] === "episode") return donghuaStream(decodeURIComponent(parts.slice(2).join("/")));
  }

  if (parts[0] === "livetv" && parts[1] === "list") return liveTvList();
  if (parts[0] === "livetv" && parts[1] === "stream") {
    return liveTvStream(search.get("channel") || search.get("slug") || "");
  }

  if (parts[0] === "anime" && parts[1] === "movies") {
    return movieLatest(Number(search.get("page") || 1));
  }

  if (parts[0] === "movies" && parts[1] === "detail") {
    return movieDetail(decodeURIComponent(parts.slice(2).join("/")));
  }

  if (parts[0] === "movies" && parts[1] === "stream") {
    return movieStream(search.get("url") || "", Number(search.get("episode") || 1));
  }

  if (parts[0] === "drachin" && parts[1] === "home") {
    return dracinLatest(Number(search.get("page") || 1));
  }

  if (parts[0] === "drachin" && parts[1] === "detail") {
    return dracinDetail(decodeURIComponent(parts.slice(2).join("/")));
  }

  if (parts[0] === "drachin" && parts[1] === "stream") {
    return dracinStream(search.get("url") || "", Number(search.get("episode") || 1));
  }

  throw new Error(`Unsupported source route: ${clean}`);
}

export async function resolvePlayableUrl(url: string, referer = ANIMASU) {
  return {
    status: true,
    data: {
      url: (await resolveDirect(url, referer)) || null,
      source: url,
    },
  };
}
