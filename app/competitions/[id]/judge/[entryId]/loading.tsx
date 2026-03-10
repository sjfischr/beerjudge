export default function JudgeScoresheetLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-44 animate-pulse rounded-full bg-stone-100" />
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-full bg-stone-100" />
          <div className="h-8 w-3/4 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-stone-100" />
        </div>
      </div>
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded-full bg-stone-100" />
        <div className="mt-4 h-28 animate-pulse rounded-3xl bg-stone-100" />
      </div>
    </div>
  );
}
