'use client';

import { useMemo, useState } from 'react';

import type { StyleCategory } from '@/lib/bjcp';

type StyleSelectorProps = {
  categories: StyleCategory[];
  initialSelectedCodes?: string[];
};

export function StyleSelector({ categories, initialSelectedCodes = [] }: StyleSelectorProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialSelectedCodes);
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  function toggleCategory(category: StyleCategory, checked: boolean) {
    const categoryCodes = category.styles.map((style) => style.code);

    setSelectedCodes((current) => {
      const next = new Set(current);

      for (const code of categoryCodes) {
        if (checked) {
          next.add(code);
        } else {
          next.delete(code);
        }
      }

      return Array.from(next);
    });
  }

  function toggleStyle(code: string, checked: boolean) {
    setSelectedCodes((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(code);
      } else {
        next.delete(code);
      }

      return Array.from(next);
    });
  }

  return (
    <div className="space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-900">Allowed BJCP styles</p>
          <p className="text-sm text-stone-600">Select entire categories or individual subcategories.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-stone-700">
          {selectedCodes.length} selected
        </span>
      </div>

      <div className="space-y-3">
        {categories.map((category) => {
          const allSelected = category.styles.every((style) => selectedSet.has(style.code));
          const someSelected = category.styles.some((style) => selectedSet.has(style.code));

          return (
            <details key={category.key} className="rounded-2xl border border-stone-200 bg-white p-4" open={someSelected}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-stone-900">{category.label}</p>
                  <p className="text-sm text-stone-500">{category.styles.length} styles</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = !allSelected && someSelected;
                      }
                    }}
                    onChange={(event) => toggleCategory(category, event.target.checked)}
                  />
                  Select category
                </label>
              </summary>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {category.styles.map((style) => (
                  <label
                    key={style.code}
                    className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(style.code)}
                      onChange={(event) => toggleStyle(style.code, event.target.checked)}
                    />
                    <span>
                      <span className="block font-medium text-stone-900">
                        {style.code}. {style.styleName}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-stone-500">
                        {style.description ? `${style.description.slice(0, 140)}${style.description.length > 140 ? '…' : ''}` : 'BJCP style reference available.'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {selectedCodes.map((code) => (
        <input key={code} type="hidden" name="allowed_styles" value={code} />
      ))}
    </div>
  );
}