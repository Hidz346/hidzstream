export default function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-2xl bg-white/5" />
          <div className="mt-2 h-4 rounded bg-white/5" />
          <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
