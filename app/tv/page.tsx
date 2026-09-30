"use client";

import { useEffect, useMemo, useState } from "react";
import { Tv, Play, RefreshCw } from "lucide-react";
import HlsPlayer from "@/components/hls-player";
import { imageSrc } from "@/components/utils";

type Channel = {
  id: string | number;
  name: string;
  number?: string | number;
  image?: string | null;
  slug: string;
  isWatchable?: boolean;
};

export default function TvPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [active, setActive] = useState<Channel | null>(null);
  const [stream, setStream] = useState("");
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [error, setError] = useState("");

  const channels = useMemo(
    () => groups.flatMap((group) => Array.isArray(group?.channels) ? group.channels : []),
    [groups],
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/tv/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        const result = payload?.data || {};
        setGroups(Array.isArray(result.genres) ? result.genres : []);
        setError(payload?.status === false ? payload.message || "Gagal memuat channel." : "");
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat channel.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function play(channel: Channel) {
    setActive(channel);
    setPlayerLoading(true);
    setStream("");
    setError("");

    try {
      const response = await fetch(
        `/api/tv/stream?channel=${encodeURIComponent(channel.slug)}`,
        { cache: "no-store" },
      );
      const payload = await response.json();

      if (!response.ok || payload?.status === false) {
        throw new Error(payload?.message || "Stream channel tidak tersedia.");
      }

      const result = payload?.data || {};
      const candidates = [
        result.streamUrl,
        ...(Array.isArray(result.streams) ? result.streams.map((item: any) => item?.url).filter(Boolean) : []),
      ].filter(Boolean);

      if (!candidates.length) {
        throw new Error("Source HLS/video channel tidak ditemukan.");
      }

      setStream(String(candidates[0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat stream.");
    } finally {
      setPlayerLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="surface rounded-[28px] p-6 md:p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">HIDZ STREAMING</div>
        <h1 className="mt-2 text-3xl font-black">HIDZ TV</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Channel Live TV mengikuti source dan struktur yang dipakai build APK.
        </p>
      </header>

      <div className="surface overflow-hidden rounded-[28px]">
        <div className="aspect-video bg-black">
          {playerLoading ? (
            <div className="grid h-full place-items-center text-sm text-muted">
              <RefreshCw className="animate-spin" size={25} />
            </div>
          ) : stream ? (
            <HlsPlayer src={stream} />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-muted">
              <div>
                <Tv className="mx-auto mb-3" size={30} />
                <p>{active ? "Source channel tidak tersedia." : "Pilih channel untuk mulai menonton."}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6">
          {error && (
            <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid h-32 place-items-center text-sm text-muted">
              <RefreshCw className="mr-2 inline-block animate-spin" size={18} />
              Memuat channel...
            </div>
          ) : channels.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {channels.map((channel: Channel) => (
                <button
                  key={String(channel.id)}
                  disabled={channel.isWatchable === false}
                  onClick={() => play(channel)}
                  className="surface group overflow-hidden rounded-2xl text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="aspect-video bg-black/40">
                    {channel.image ? (
                      <img src={imageSrc(channel.image)} alt="" className="h-full w-full object-contain p-4" />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Tv size={25} className="text-muted" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="line-clamp-2 text-xs font-black">{channel.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                      <Play size={11} />
                      {channel.number || "Live"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-muted">
              Belum ada channel dari source.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
