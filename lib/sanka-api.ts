const DEFAULT_BASE_URL = "https://nanzstream-api.vercel.app/api";

const PRIMARY_BASE_URL = (
  process.env.NANZSTREAM_API_URL ||
  process.env.SANKA_API_URL ||
  DEFAULT_BASE_URL
).replace(/\/$/, "");

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function sourceError(data: any) {
  return data?.status === false || Boolean(data?.error && !data?.result && !data?.data);
}

async function requestJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HidzStreaming/1.0",
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} from upstream API`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const data = await response.json();
  if (sourceError(data)) {
    throw new Error(data?.message || "Upstream API returned an error");
  }

  return data;
}

function makeTarget(path: string) {
  const url = new URL(`https://local${normalizePath(path)}`);
  const parts = url.pathname.split("/").filter(Boolean);
  const search = url.searchParams;

  const page = search.get("page") || "1";

  if (parts[0] === "anime" && parts[1] === "animasu") {
    if (parts[2] === "home") {
      return { endpoint: "/anime/latest", params: { page } };
    }
    if (parts[2] === "search" && parts[3]) {
      return {
        endpoint: "/anime/search",
        params: { query: parts.slice(3).join("/"), page },
      };
    }
    if (parts[2] === "detail" && parts[3]) {
      return { endpoint: "/anime/detail", params: { url: parts.slice(3).join("/") } };
    }
    if (parts[2] === "episode" && parts[3]) {
      return { endpoint: "/anime/stream", params: { url: parts.slice(3).join("/") } };
    }
  }

  if (parts[0] === "comic") {
    if (parts[1] === "homepage") {
      return { endpoint: "/manga/home", params: {} };
    }
    if (parts[1] === "search" && parts[2]) {
      return { endpoint: "/manga/search", params: { query: parts.slice(2).join("/") } };
    }
    if (parts[1] === "comic" && parts[2]) {
      return { endpoint: "/manga/detail", params: { id: parts.slice(2).join("/") } };
    }
    if (parts[1] === "chapter" && parts[2]) {
      return { endpoint: "/manga/read", params: { chapterId: parts.slice(2).join("/") } };
    }
  }

  if (parts[0] === "donghua") {
    if (parts[1] === "home") {
      return { endpoint: "/donghua/latest", params: { page } };
    }
    if (parts[1] === "search" && parts[2]) {
      return {
        endpoint: "/donghua/search",
        params: { query: parts.slice(2).join("/"), page },
      };
    }
    if (parts[1] === "detail" && parts[2]) {
      return { endpoint: "/donghua/detail", params: { url: parts.slice(2).join("/") } };
    }
    if (parts[1] === "episode" && parts[2]) {
      return { endpoint: "/donghua/stream", params: { url: parts.slice(2).join("/") } };
    }
  }

  const fallbackQuery: Record<string, string> = {};
  search.forEach((value, key) => {
    fallbackQuery[key] = value;
  });

  return {
    endpoint: normalizePath(url.pathname),
    params: fallbackQuery,
  };
}

function queryString(params: Record<string, string>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

function normalizePayload(path: string, payload: any) {
  const result = payload?.result ?? payload?.data ?? payload;

  if (/^\\/anime\\/latest|^\\/anime\\/search/.test(path)) {
    return { status: true, data: Array.isArray(result?.data) ? result.data : [] };
  }

  if (path === "/anime/detail") {
    return {
      status: true,
      data: {
        ...result,
        poster: result?.thumbnail || null,
        thumb: result?.thumbnail || null,
        episodeList: Array.isArray(result?.episodes)
          ? result.episodes.map((episode: any) => ({
              ...episode,
              episodeId: episode?.url || episode?.episodeId || episode?.id || "",
              slug: episode?.url || episode?.slug || "",
            }))
          : [],
      },
    };
  }

  if (path === "/anime/stream") {
    return {
      status: true,
      data: {
        ...result,
        streams: Array.isArray(result?.streams) ? result.streams : [],
      },
    };
  }

  if (/^\\/donghua\\/latest|^\\/donghua\\/search/.test(path)) {
    return { status: true, data: Array.isArray(result?.data) ? result.data : [] };
  }

  if (path === "/donghua/detail") {
    return {
      status: true,
      data: {
        ...result,
        poster: result?.thumbnail || null,
        episodes: Array.isArray(result?.episodes)
          ? result.episodes.map((episode: any) => ({
              ...episode,
              episodeId: episode?.url || episode?.episodeId || episode?.id || "",
              slug: episode?.url || episode?.slug || "",
            }))
          : [],
      },
    };
  }

  if (path === "/donghua/stream") {
    const servers = Array.isArray(result?.servers)
      ? result.servers.map((server: any) => ({
          ...server,
          title: server?.title || server?.name || "Server",
          name: server?.name || server?.title || "Server",
          url: server?.url || server?.iframe || "",
          iframe: server?.iframe || server?.url || "",
        }))
      : [];

    return { status: true, data: { ...result, servers } };
  }

  if (path === "/manga/home") {
    const merged = Object.values(result || {})
      .filter(Array.isArray)
      .flat()
      .filter((item: any) => item && typeof item === "object" && (item.title || item.name || item.titleName));

    return { status: true, data: merged };
  }

  if (path === "/manga/detail") {
    return {
      status: true,
      data: {
        ...result,
        image: result?.thumbnail || null,
        poster: result?.thumbnail || null,
        chapters: Array.isArray(result?.chapters)
          ? result.chapters.map((chapter: any) => ({
              ...chapter,
              id: chapter?.id || chapter?.chapterId || chapter?.chapter_id || "",
            }))
          : [],
      },
    };
  }

  if (path === "/manga/read") {
    return {
      status: true,
      data: {
        title: result?.title || "Comic Chapter",
        chapterId: result?.chapterId || null,
        images: Array.isArray(result?.pages) ? result.pages : [],
        nextChapter: result?.nextChapter || null,
      },
    };
  }

  return payload;
}

export async function fetchSankaJson(path: string) {
  const target = makeTarget(path);
  const base = PRIMARY_BASE_URL.replace(/\/$/, "");
  const targetPath = target.endpoint;
  const url = `${base}${normalizePath(targetPath)}${queryString(target.params)}`;
  const payload = await requestJson(url);
  return normalizePayload(targetPath, payload);
}

export function getSankaBaseUrl() {
  return PRIMARY_BASE_URL;
}
