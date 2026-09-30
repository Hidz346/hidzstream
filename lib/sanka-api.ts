const DEFAULT_BASE_URL = "https://www.sankavollerei.web.id";
const FALLBACK_BASE_URLS = [
  process.env.SANKA_API_FALLBACK_URL,
  DEFAULT_BASE_URL,
  "https://sankavollerei.web.id",
  "https://www.sankavollerei.com",
].filter(Boolean) as string[];

const PRIMARY_BASE_URL = (process.env.SANKA_API_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);
const buildUrl = (base: string, path: string) => `${base.replace(/\/$/, "")}${normalizePath(path)}`;

const isRetryableStatus = (status: number) =>
  status === 401 ||
  status === 403 ||
  status === 408 ||
  status === 425 ||
  status === 429 ||
  status >= 500;

const isInvalidPayload = (data: unknown) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  const value = data as Record<string, unknown>;
  if (value.error && !value.data && !value.result && !value.anime_detail && !value.streaming) {
    return true;
  }

  return value.status === false && !value.data && !value.result;
};

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
    const error = new Error(`HTTP ${response.status} from ${url}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const data = await response.json();
  if (isInvalidPayload(data)) {
    throw new Error(`Invalid API response from ${url}`);
  }

  return data;
}

const shouldTryAnotherBase = (error: unknown) => {
  const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
  if (typeof status === "number") return isRetryableStatus(status);

  const message = error instanceof Error ? error.message : String(error || "");
  return /fetch failed|timed out|timeout|network|invalid api response/i.test(message);
};

export async function fetchSankaJson(path: string) {
  const bases = Array.from(
    new Set([PRIMARY_BASE_URL, ...FALLBACK_BASE_URLS.map((base) => base.replace(/\/$/, ""))])
  );

  let lastError: unknown;

  for (const base of bases) {
    try {
      return await requestJson(buildUrl(base, path));
    } catch (error) {
      lastError = error;
      if (!shouldTryAnotherBase(error)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Sanka API request failed");
}

export function getSankaBaseUrl() {
  return PRIMARY_BASE_URL;
}
