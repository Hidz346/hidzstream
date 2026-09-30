"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError("");
    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void video.load();

      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setError("Browser ini tidak mendukung pemutaran HLS.");
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60,
      maxBufferLength: 30,
    });

    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      setError(
        data.type === Hls.ErrorTypes.NETWORK_ERROR
          ? "Gagal memuat stream HLS dari server sumber."
          : "Stream HLS tidak dapat diputar.",
      );
    });

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full bg-black"
        aria-label="HIDZ TV Player"
      />
      {error && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl bg-black/75 px-4 py-3 text-center text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
