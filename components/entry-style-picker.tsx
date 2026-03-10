'use client';

import { useEffect, useMemo, useState } from 'react';

import type { StyleCategory } from '@/lib/bjcp';

function formatRange(min: number | null, max: number | null, suffix = '') {
  if (min === null && max === null) {
    return '—';
  }

  if (min !== null && max !== null) {
    return `${min}–${max}${suffix}`;
  }

  return `${min ?? max}${suffix}`;
}

type EntryStylePickerProps = {
  categories: StyleCategory[];
};

export function EntryStylePicker({ categories }: EntryStylePickerProps) {
  const [selectedCategoryNumber, setSelectedCategoryNumber] = useState(categories[0]?.categoryNumber ?? '');
  const stylesForCategory = useMemo(
    () => categories.find((category) => category.categoryNumber === selectedCategoryNumber)?.styles ?? [],
    [categories, selectedCategoryNumber],
  );
  const [selectedStyleCode, setSelectedStyleCode] = useState(stylesForCategory[0]?.code ?? '');

  useEffect(() => {
    if (!stylesForCategory.some((style) => style.code === selectedStyleCode)) {
      setSelectedStyleCode(stylesForCategory[0]?.code ?? '');
    }
  }, [selectedStyleCode, stylesForCategory]);

  const selectedStyle = stylesForCategory.find((style) => style.code === selectedStyleCode) ?? stylesForCategory[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="bjcp-category" className="block text-sm font-medium text-stone-700">
            BJCP category
          </label>
          <select
            id="bjcp-category"
            value={selectedCategoryNumber}
            onChange={(event) => setSelectedCategoryNumber(event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          >
            {categories.map((category) => (
              <option key={category.key} value={category.categoryNumber}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="bjcp-style" className="block text-sm font-medium text-stone-700">
            BJCP subcategory
          </label>
          <select
            id="bjcp-style"
            value={selectedStyleCode}
            onChange={(event) => setSelectedStyleCode(event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          >
            {stylesForCategory.map((style) => (
              <option key={style.code} value={style.code}>
                {style.code}. {style.styleName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStyle ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Style reference</p>
            <h3 className="text-xl font-semibold text-stone-900">
              {selectedStyle.code}. {selectedStyle.styleName}
            </h3>
            <p className="text-sm leading-6 text-stone-600">
              {selectedStyle.description || 'BJCP reference details are available for this style.'}
            </p>
          </div>

          <dl className="mt-4 grid gap-3 text-sm text-stone-600 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <dt className="font-medium text-stone-900">OG</dt>
              <dd>{formatRange(selectedStyle.ogMin, selectedStyle.ogMax)}</dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <dt className="font-medium text-stone-900">FG</dt>
              <dd>{formatRange(selectedStyle.fgMin, selectedStyle.fgMax)}</dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <dt className="font-medium text-stone-900">IBU</dt>
              <dd>{formatRange(selectedStyle.ibuMin, selectedStyle.ibuMax)}</dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <dt className="font-medium text-stone-900">SRM</dt>
              <dd>{formatRange(selectedStyle.srmMin, selectedStyle.srmMax)}</dd>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <dt className="font-medium text-stone-900">ABV</dt>
              <dd>{formatRange(selectedStyle.abvMin, selectedStyle.abvMax, '%')}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <input type="hidden" name="style_code" value={selectedStyleCode} />
    </div>
  );
}