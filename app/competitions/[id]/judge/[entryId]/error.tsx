'use client';

export default function JudgeScoresheetError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
      <h2 className="text-2xl font-semibold">Something went wrong loading this scoresheet.</h2>
      <p className="mt-3 text-sm leading-6">
        Try refreshing. If it keeps happening, go back to your judging queue and reopen the entry.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  );
}
