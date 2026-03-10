'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { createClient } from '@/lib/supabase/browser';
import {
  BJCP_OFF_FLAVOR_DESCRIPTORS,
  computeTotalScore,
  scoreTier,
  type OffFlavorDescriptor,
  type ScoresheetDraft,
  validateFinalSubmission,
} from '@/lib/scoresheet';

type EntryHeader = {
  entryId: string;
  entryNumber: number;
  bjcpCode: string;
  styleName: string;
  competitionName: string;
  judgeName: string;
  status: 'draft' | 'submitted' | null;
  initialDraft: ScoresheetDraft;
  submittedAt: string | null;
};

type Props = {
  header: EntryHeader;
};

const SECTION_CARD = 'rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm';

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toInt(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-rose-700">{message}</p>;
}

function SkeletonLine() {
  return <div className="h-4 w-full animate-pulse rounded-full bg-stone-100" />;
}

export default function JudgeScoresheetClient({ header }: Props) {
  const [draft, setDraft] = useState<ScoresheetDraft>(header.initialDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitted = header.status === 'submitted';
  const readOnly = isSubmitted;

  const total = useMemo(() => computeTotalScore(draft), [draft]);
  const tier = useMemo(() => scoreTier(total), [total]);

  const supabase = useMemo(() => createClient(), []);
  const autosaveTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastSavedAtRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  const showToast = useCallback((kind: 'success' | 'error', message: string) => {
    setToast({ kind, message });
    window.clearTimeout(toastTimerRef.current ?? undefined);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  const persistDraft = useCallback(
    async (nextDraft: ScoresheetDraft) => {
      if (readOnly) return;
      if (savingRef.current) return;

      savingRef.current = true;
      const { error } = await supabase.from('scoresheets').upsert(
        {
          entry_id: header.entryId,
          status: 'draft',
          ...nextDraft,
        },
        { onConflict: 'entry_id,judge_id' },
      );
      savingRef.current = false;

      if (error) {
        showToast('error', 'Could not save draft.');
        return;
      }

      lastSavedAtRef.current = Date.now();
    },
    [header.entryId, readOnly, showToast, supabase],
  );

  const scheduleAutosave = useCallback(
    (nextDraft: ScoresheetDraft) => {
      if (readOnly) return;
      window.clearTimeout(autosaveTimerRef.current ?? undefined);
      autosaveTimerRef.current = window.setTimeout(() => {
        persistDraft(nextDraft).catch(() => {
          showToast('error', 'Autosave failed.');
        });
      }, 650);
    },
    [persistDraft, readOnly, showToast],
  );

  const updateField = useCallback(
    <K extends keyof ScoresheetDraft>(field: K, value: ScoresheetDraft[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [field]: value };
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave],
  );

  const toggleDescriptor = useCallback(
    (descriptor: OffFlavorDescriptor) => {
      updateField(
        'descriptors',
        draft.descriptors.includes(descriptor)
          ? (draft.descriptors.filter((d) => d !== descriptor) as OffFlavorDescriptor[])
          : ([...draft.descriptors, descriptor] as OffFlavorDescriptor[]),
      );
    },
    [draft.descriptors, updateField],
  );

  const handleSaveNow = useCallback(() => {
    startTransition(() => {
      persistDraft(draft)
        .then(() => showToast('success', 'Draft saved.'))
        .catch(() => showToast('error', 'Could not save draft.'));
    });
  }, [draft, persistDraft, showToast]);

  const handleSubmit = useCallback(() => {
    if (readOnly) return;

    const validation = validateFinalSubmission(draft);
    setErrors(validation.errors);

    if (!validation.ok) {
      showToast('error', 'Fix the highlighted fields before submitting.');
      return;
    }

    startTransition(() => {
      (async () => {
        try {
          const { error } = await supabase
            .from('scoresheets')
            .update({ status: 'submitted', submitted_at: new Date().toISOString(), ...draft })
            .eq('entry_id', header.entryId)
            .eq('status', 'draft');

          if (error) {
            showToast('error', error.message || 'Submission failed.');
            return;
          }

          showToast('success', 'Scoresheet submitted.');
          window.location.reload();
        } catch {
          showToast('error', 'Submission failed.');
        }
      })();
    });
  }, [draft, header.entryId, readOnly, showToast, supabase]);

  useEffect(() => {
    return () => {
      window.clearTimeout(autosaveTimerRef.current ?? undefined);
      window.clearTimeout(toastTimerRef.current ?? undefined);
    };
  }, []);

  const lastSavedLabel = useMemo(() => {
    if (readOnly) return null;
    if (!lastSavedAtRef.current) return 'Not saved yet';
    const seconds = Math.round((Date.now() - lastSavedAtRef.current) / 1000);
    if (seconds < 5) return 'Saved just now';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const mins = Math.round(seconds / 60);
    return `Saved ${mins}m ago`;
  }, [readOnly]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">BJCP scoresheet</p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
              Entry #{header.entryNumber} — {header.bjcpCode}. {header.styleName}
            </h1>
            <p className="text-sm text-stone-600">{header.competitionName}</p>
            <p className="text-sm text-stone-600">
              Judge: <span className="font-medium text-stone-900">{header.judgeName}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm ring-1 ring-stone-200">
              Total: <span className="text-stone-950">{total}</span> / 50{' '}
              <span className={`ml-2 ${tier.className}`}>({tier.label})</span>
            </div>
            {readOnly ? (
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                Submitted
              </div>
            ) : (
              <div className="text-xs font-medium text-stone-600">{lastSavedLabel}</div>
            )}
          </div>
        </div>
      </section>

      {toast ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
            toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className={SECTION_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Aroma</h2>
                <p className="mt-1 text-sm text-stone-600">Score 0–12. Focus on malt, hops, esters, and fermentation character.</p>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Score</label>
                <input
                  inputMode="numeric"
                  value={draft.aroma_score ?? ''}
                  disabled={readOnly}
                  onChange={(event) => {
                    const parsed = toInt(event.target.value);
                    updateField('aroma_score', parsed === null ? null : clampNumber(parsed, 0, 12));
                  }}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />
                <FieldError message={errors.aroma_score} />
              </div>
            </div>
            <textarea
              value={draft.aroma_comments}
              disabled={readOnly}
              onChange={(event) => updateField('aroma_comments', event.target.value)}
              placeholder="What do you perceive? What’s working, what could be improved?"
              className="mt-4 min-h-[110px] w-full resize-y rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
            <FieldError message={errors.aroma_comments} />
          </section>

          <section className={SECTION_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Appearance</h2>
                <p className="mt-1 text-sm text-stone-600">Score 0–3. Color, clarity, and head retention.</p>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Score</label>
                <input
                  inputMode="numeric"
                  value={draft.appearance_score ?? ''}
                  disabled={readOnly}
                  onChange={(event) => {
                    const parsed = toInt(event.target.value);
                    updateField('appearance_score', parsed === null ? null : clampNumber(parsed, 0, 3));
                  }}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />
                <FieldError message={errors.appearance_score} />
              </div>
            </div>
            <textarea
              value={draft.appearance_comments}
              disabled={readOnly}
              onChange={(event) => updateField('appearance_comments', event.target.value)}
              placeholder="Describe the visual impression."
              className="mt-4 min-h-[90px] w-full resize-y rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
            <FieldError message={errors.appearance_comments} />
          </section>

          <section className={SECTION_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Flavor</h2>
                <p className="mt-1 text-sm text-stone-600">Score 0–20. Balance, finish, fermentation profile, and any faults.</p>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Score</label>
                <input
                  inputMode="numeric"
                  value={draft.flavor_score ?? ''}
                  disabled={readOnly}
                  onChange={(event) => {
                    const parsed = toInt(event.target.value);
                    updateField('flavor_score', parsed === null ? null : clampNumber(parsed, 0, 20));
                  }}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />
                <FieldError message={errors.flavor_score} />
              </div>
            </div>
            <textarea
              value={draft.flavor_comments}
              disabled={readOnly}
              onChange={(event) => updateField('flavor_comments', event.target.value)}
              placeholder="Call out malt/hop character, balance, fermentation notes, and finish."
              className="mt-4 min-h-[130px] w-full resize-y rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
            <FieldError message={errors.flavor_comments} />
          </section>

          <section className={SECTION_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Mouthfeel</h2>
                <p className="mt-1 text-sm text-stone-600">Score 0–5. Body, carbonation, warmth, creaminess, and astringency.</p>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Score</label>
                <input
                  inputMode="numeric"
                  value={draft.mouthfeel_score ?? ''}
                  disabled={readOnly}
                  onChange={(event) => {
                    const parsed = toInt(event.target.value);
                    updateField('mouthfeel_score', parsed === null ? null : clampNumber(parsed, 0, 5));
                  }}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />
                <FieldError message={errors.mouthfeel_score} />
              </div>
            </div>
            <textarea
              value={draft.mouthfeel_comments}
              disabled={readOnly}
              onChange={(event) => updateField('mouthfeel_comments', event.target.value)}
              placeholder="What does the body/carbonation feel like? Any harshness or slickness?"
              className="mt-4 min-h-[110px] w-full resize-y rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
            <FieldError message={errors.mouthfeel_comments} />
          </section>

          <section className={SECTION_CARD}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">Overall impression</h2>
                <p className="mt-1 text-sm text-stone-600">Score 0–10. Your holistic assessment and best improvement advice.</p>
              </div>
              <div className="w-28">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Score</label>
                <input
                  inputMode="numeric"
                  value={draft.overall_score ?? ''}
                  disabled={readOnly}
                  onChange={(event) => {
                    const parsed = toInt(event.target.value);
                    updateField('overall_score', parsed === null ? null : clampNumber(parsed, 0, 10));
                  }}
                  className="mt-1 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                />
                <FieldError message={errors.overall_score} />
              </div>
            </div>
            <textarea
              value={draft.overall_comments}
              disabled={readOnly}
              onChange={(event) => updateField('overall_comments', event.target.value)}
              placeholder="Summarize strengths and your top 1–2 recommendations."
              className="mt-4 min-h-[120px] w-full resize-y rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
            />
            <FieldError message={errors.overall_comments} />
          </section>

          <section className={SECTION_CARD}>
            <h2 className="text-xl font-semibold text-stone-900">Descriptors</h2>
            <p className="mt-1 text-sm text-stone-600">Tick any BJCP off-flavor descriptors that apply.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {BJCP_OFF_FLAVOR_DESCRIPTORS.map((descriptor) => (
                <label
                  key={descriptor}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                    draft.descriptors.includes(descriptor)
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-stone-200 bg-white hover:border-amber-200'
                  } ${readOnly ? 'opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={draft.descriptors.includes(descriptor)}
                    disabled={readOnly}
                    onChange={() => toggleDescriptor(descriptor)}
                    className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-200"
                  />
                  <span className="font-medium text-stone-800">{descriptor}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={SECTION_CARD}>
            <h2 className="text-xl font-semibold text-stone-900">Summary assessments</h2>
            <p className="mt-1 text-sm text-stone-600">Quick 1–5 ratings to reinforce your overall impression.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {([
                { key: 'stylistic_accuracy' as const, label: 'Stylistic accuracy' },
                { key: 'technical_merit' as const, label: 'Technical merit' },
                { key: 'intangibles' as const, label: 'Intangibles' },
              ] as const).map((item) => (
                <div key={item.key} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <label className="text-sm font-semibold text-stone-900">{item.label}</label>
                  <input
                    inputMode="numeric"
                    value={draft[item.key] ?? ''}
                    disabled={readOnly}
                    onChange={(event) => {
                      const parsed = toInt(event.target.value);
                      updateField(item.key, parsed === null ? null : clampNumber(parsed, 1, 5));
                    }}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-stone-100"
                  />
                  <FieldError message={errors[item.key]} />
                </div>
              ))}
            </div>
          </section>

          <details className={`${SECTION_CARD} bg-stone-50`}>
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-stone-600">Scoring guide</summary>
            <div className="mt-4 space-y-2 text-sm leading-6 text-stone-600">
              <p>
                <span className="font-semibold text-stone-900">45–50</span>: world-class example.
              </p>
              <p>
                <span className="font-semibold text-stone-900">38–44</span>: excellent.
              </p>
              <p>
                <span className="font-semibold text-stone-900">30–37</span>: very good.
              </p>
              <p>
                <span className="font-semibold text-stone-900">21–29</span>: good.
              </p>
              <p>
                <span className="font-semibold text-stone-900">14–20</span>: fair.
              </p>
              <p>
                <span className="font-semibold text-stone-900">0–13</span>: problematic.
              </p>
            </div>
          </details>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-stone-900">Actions</h2>
              <p className="mt-1 text-sm text-stone-600">Autosaves drafts. Submit locks the sheet.</p>

              {readOnly ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Read-only</p>
                  <p className="mt-1">Submitted scoresheets are locked.</p>
                  {header.submittedAt ? (
                    <p className="mt-2 text-xs text-emerald-800">Submitted: {new Date(header.submittedAt).toLocaleString()}</p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleSaveNow}
                    disabled={isPending}
                    className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-amber-400 hover:text-amber-800 disabled:opacity-60"
                  >
                    {isPending ? 'Saving…' : 'Save draft'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="w-full rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-60"
                  >
                    {isPending ? 'Submitting…' : 'Submit final'}
                  </button>
                  <p className="text-xs leading-5 text-stone-500">
                    Tip: Tab/Shift+Tab between fields; autosave triggers ~650ms after you stop typing.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-stone-900">Running total</h2>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div className="flex items-center justify-between">
                  <span>Aroma</span>
                  <span className="font-semibold text-stone-900">{draft.aroma_score ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Appearance</span>
                  <span className="font-semibold text-stone-900">{draft.appearance_score ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Flavor</span>
                  <span className="font-semibold text-stone-900">{draft.flavor_score ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mouthfeel</span>
                  <span className="font-semibold text-stone-900">{draft.mouthfeel_score ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Overall</span>
                  <span className="font-semibold text-stone-900">{draft.overall_score ?? '—'}</span>
                </div>
                <div className="mt-3 border-t border-stone-200 pt-3">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold text-stone-900">Total</span>
                    <span className="font-semibold text-stone-950">{total}</span>
                  </div>
                  <p className={`mt-1 text-sm font-semibold ${tier.className}`}>{tier.label}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-stone-900">Loading state preview</h2>
              <p className="mt-1 text-sm text-stone-600">A tiny skeleton for perceived performance.</p>
              <div className="mt-4 space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <div className="h-16 animate-pulse rounded-3xl bg-stone-100" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
