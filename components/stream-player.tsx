"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type StreamPlayerProps = {
  src: string;
  title?: string;
  onError?: (message: string) => void;
};

const isHls = (src: string) => /\.m3u8(?:$|[?#])/i.test(src);
const isVideo = (src: string) => /\.(?:mp4|webm|ogg)(?:$|[?#])/i.test(src);

export default function StreamPlayer({ src, title = "HidzStreaming Player", onError }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError("");
    onError?.("");

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!isHls(src)) {
      video.src = src;
      void video.load();
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void video.load();
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      const message = "Browser ini tidak mendukung HLS untuk URL langsung.";
      setError(message);
      onError?.(message);
      return;
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90,
    });

    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    const handleError = (_event: string, data: Hls.ErrorData) => {
      if (!data.fatal) return;

      const message =
        data.type === Hls.ErrorTypes.NETWORK_ERROR
          ? "Gagal memuat stream HLS dari server sumber."
          : "Stream HLS tidak dapat diputar pada player ini.";

      setError(message);
      onError?.(message);
      hls.destroy();
      hlsRef.current = null;
    };

    hls.on(Hls.Events.ERROR, handleError);

    return () => {
      hls.off(Hls.Events.ERROR, handleError);
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src, onError]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full bg-black"
        controlsList="nodownload"
        aria-label={title}
      />

      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div className="max-w-md">
            <div className="text-sm font-black text-red-300">Player error</div>
            <p className="mt-2 text-xs leading-6 text-white/60">{error}</p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-black"
            >
              Buka sumber langsung
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { isHls, isVideo };
