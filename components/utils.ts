export function getList(input: any): any[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;

  const result = input?.result;
  const candidates = [
    input.data,
    input.results,
    input.items,
    input.list,
    input.latest,
    input.latest_release,
    input.recent,
    input.ongoing,
    input.popular,
    input.trending,
    input.completed,
    input.ongoing_anime,
    input.completed_anime,
    input.anime_list,
    input.search,
    input.comics,
    input.chapterList,
    result?.data,
    result?.items,
    result?.list,
    result?.latest,
    result?.latest_release,
    result?.recent,
    result?.ongoing,
    result?.popular,
    result?.trending,
    result?.completed,
    result?.comics,
  ];

  return candidates
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter(Boolean);
}

export function mediaTitle(item: any) {
  return item?.title || item?.name || item?.anime_title || item?.comic_title || item?.titleName || "Untitled";
}

export function mediaImage(item: any) {
  return item?.poster || item?.thumb || item?.image || item?.cover || item?.thumbnail || item?.imageUrl || "";
}

export function mediaSlug(item: any) {
  return item?.slug || item?.animeId || item?.id || item?.mal_id || item?.endpoint || item?.url || "";
}

export function imageSrc(url?: string) {
  return url
    ? `/api/image-proxy?url=${encodeURIComponent(url)}`
    : "https://placehold.co/480x720/111827/94a3b8.png?text=Hidz";
}
