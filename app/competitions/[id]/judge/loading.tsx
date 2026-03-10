export default function JudgeQueueLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-stone-100" />
          <div className="h-8 w-2/3 animate-pulse rounded-2xl bg-stone-100" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-stone-100" />
        </div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded-full bg-stone-100" />
            <div className="mt-3 h-6 w-2/3 animate-pulse rounded-2xl bg-stone-100" />
            <div className="mt-4 h-4 w-32 animate-pulse rounded-full bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
