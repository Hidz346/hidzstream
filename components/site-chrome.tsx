"use client";

import Link from "next/link";
import { Search, Menu, X, House, Play, BookOpen, Tv, Youtube, Clapperboard, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import Brand from "@/components/brand";
import ThemeToggle from "@/components/theme-toggle";

type NavItem = readonly [href: string, label: string, Icon: LucideIcon];

const nav: readonly NavItem[] = [
  ["/anime", "HIDZ ANIME", Play],
  ["/comic", "HIDZ COMIC", BookOpen],
  ["/donghua", "HIDZ DONGHUA", Sparkles],
  ["/drachin", "HIDZ DRACHIN", Clapperboard],
  ["/movies", "HIDZ MOVIES", Clapperboard],
  ["/youtube", "HIDZ YOUTUBE", Youtube],
  ["/tv", "HIDZ TV", Tv],
];

const mobileNav: readonly NavItem[] = [
  ["/", "Home", House],
  ["/anime", "Anime", Play],
  ["/comic", "Comic", BookOpen],
  ["/donghua", "Donghua", Sparkles],
  ["/tv", "TV", Tv],
];

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = q.trim();
    if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-6">
          <button className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5" onClick={() => setOpen(true)} aria-label="Buka menu">
            <Menu size={19} />
          </button>
          <Brand />
          <nav className="ml-3 hidden items-center gap-1 xl:flex">
            {nav.map(([href, label, Icon]) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold transition ${active ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white"}`}>
                  <Icon size={15} /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={submit} className="hidden min-w-0 md:block">
              <div className="flex h-10 w-[280px] items-center rounded-full border border-white/10 bg-white/5 px-3">
                <Search size={16} className="shrink-0 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari anime, comic..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted" />
              </div>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/70 md:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[86vw] max-w-sm border-r border-white/10 bg-[var(--bg)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Brand />
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white/5" onClick={() => setOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
            </div>
            <div className="mt-6 space-y-1">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted hover:bg-white/5 hover:text-white"><House size={18}/> Home</Link>
              {nav.map(([href, label, Icon]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted hover:bg-white/5 hover:text-white"><Icon size={18}/> {label}</Link>
              ))}
            </div>
            <form onSubmit={submit} className="mt-5">
              <div className="flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-3">
                <Search size={16} className="text-muted"/>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"/>
              </div>
            </form>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-5 md:px-6 md:pb-12">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNav.map(([href, label, Icon]) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link href={href} key={href} className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${active ? "bg-white/10 text-white" : "text-muted"}`}>
                <Icon size={17}/>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="border-t border-white/10 px-4 py-10 text-center text-xs text-muted">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 font-semibold text-[var(--text)]">HidzStreaming</div>
          <p>Interface dan aggregator milik HidzStreaming. Media yang ditampilkan dapat berasal dari layanan pihak ketiga dan ketersediaannya dapat berubah.</p>
          <p className="mt-2">© {new Date().getFullYear()} HIDZPROJECT</p>
        </div>
      </footer>
    </div>
  );
}
