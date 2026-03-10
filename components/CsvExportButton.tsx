'use client';

type Props = {
  filename: string;
  rows: Array<Record<string, string | number | boolean | null | undefined>>;
};

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const escaped = raw.replaceAll('"', '""');
  return `"${escaped}"`;
}

export default function CsvExportButton({ filename, rows }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        const headers = Array.from(
          rows.reduce((set, row) => {
            Object.keys(row).forEach((key) => set.add(key));
            return set;
          }, new Set<string>()),
        );

        const lines = [headers.join(',')];
        for (const row of rows) {
          lines.push(headers.map((header) => toCsvValue(row[header])).join(','));
        }

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }}
      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-amber-400 hover:text-amber-800"
    >
      Export CSV
    </button>
  );
}
