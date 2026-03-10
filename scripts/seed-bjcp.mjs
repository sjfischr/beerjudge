import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

autoRun().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function fixMojibake(value) {
  if (!value) {
    return value;
  }

  return value
    .replaceAll('â€œ', '“')
    .replaceAll('â€', '”')
    .replaceAll('â€“', '–')
    .replaceAll('â€™', '’')
    .replaceAll('Ã¶', 'ö')
    .replaceAll('Ã¤', 'ä')
    .replaceAll('Ã¼', 'ü')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã¨', 'è')
    .replaceAll('Ãª', 'ê')
    .replaceAll('Ã', 'à');
}

function normalizeDescription(value) {
  return fixMojibake(value ?? '').replace(/\*\*/g, '').trim() || null;
}

function toNullableNumeric(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function autoRun() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed BJCP styles.');
  }

  const csvPath = path.join(rootDir, 'docs', 'BJCP_2021_STYLES_EXTRACT.csv');
  const csvText = await readFile(csvPath, 'utf8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  const styles = records.map((record) => ({
    category_number: record.category_number,
    subcategory_letter: record.subcategory_letter || null,
    category_name: fixMojibake(record.category_name),
    style_name: fixMojibake(record.style_name),
    og_min: toNullableNumeric(record.og_min),
    og_max: toNullableNumeric(record.og_max),
    fg_min: toNullableNumeric(record.fg_min),
    fg_max: toNullableNumeric(record.fg_max),
    ibu_min: toNullableNumeric(record.ibu_min),
    ibu_max: toNullableNumeric(record.ibu_max),
    srm_min: toNullableNumeric(record.srm_min),
    srm_max: toNullableNumeric(record.srm_max),
    abv_min: toNullableNumeric(record.abv_min),
    abv_max: toNullableNumeric(record.abv_max),
    description: normalizeDescription(record.description),
  }));

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await supabase.from('bjcp_styles').delete().neq('id', 0);
  if (deleteError) {
    throw deleteError;
  }

  const chunkSize = 50;
  for (let index = 0; index < styles.length; index += chunkSize) {
    const batch = styles.slice(index, index + chunkSize);
    const { error } = await supabase.from('bjcp_styles').insert(batch);
    if (error) {
      throw error;
    }
  }

  console.log(`Seeded ${styles.length} BJCP styles from ${path.relative(rootDir, csvPath)}.`);
}
