'use client';

export default function JudgeQueueError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-900 shadow-sm">
      <h2 className="text-2xl font-semibold">Could not load judging assignments.</h2>
      <p className="mt-3 text-sm leading-6">Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800"
      >
        Retry
      </button>
    </div>
  );
}
