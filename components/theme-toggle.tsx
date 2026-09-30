"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hidz-theme");
    const current = saved === "light";
    document.documentElement.dataset.theme = current ? "light" : "dark";
    setLight(current);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("hidz-theme", next ? "light" : "dark");
  }

  return (
    <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10" aria-label="Ganti tema">
      {light ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
