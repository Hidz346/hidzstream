import { fetchApkJson } from "@/lib/apk-web";

export async function fetchSankaJson(path: string) {
  const url = new URL(`https://local${path.startsWith("/") ? path : `/${path}`}`);
  return fetchApkJson(url.pathname, url.searchParams);
}

export function getSankaBaseUrl() {
  return "internal-apk-engine";
}
