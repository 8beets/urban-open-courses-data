import { parse } from 'csv-parse/sync';

/**
 * Rows as objects keyed by header, values trimmed. Handles a UTF-8 BOM and quoted fields;
 * fails on missing columns or rows with the wrong number of fields.
 */
export function csvObjects(
  text: string,
  required: string[],
  delimiter = ';',
): Record<string, string>[] {
  const rows: Record<string, string>[] = parse(text, {
    delimiter,
    bom: true,
    columns: true,
    // Same as UrbanLabs: blank lines and rows with only empty fields are not records.
    skip_empty_lines: true,
    skip_records_with_empty_values: true,
  });
  const header = rows[0] ? Object.keys(rows[0]) : [];
  for (const column of required)
    if (!header.includes(column)) throw new Error(`CSV lacks column ${column}`);
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.trim()])),
  );
}
