#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { madrid } from './cities/es/madrid.ts';
import type { Centre, CityConverter } from './lib/types.ts';

// Add a city here once its converter exists under src/cities/<country>/.
const cities: Record<string, CityConverter> = { madrid };

const program = new Command('courses').description(
  'Turn hand-downloaded course data into UrbanLabs centres and course records',
);

function converterFor(city: string): CityConverter {
  const converter = cities[city];
  if (!converter) program.error(`Unknown city "${city}". Known: ${Object.keys(cities).join(', ')}`);
  return converter;
}

async function readText(pathOrUrl: string): Promise<string> {
  if (!/^https?:\/\//.test(pathOrUrl)) return readFile(pathOrUrl, 'utf8');
  const response = await fetch(pathOrUrl);
  if (!response.ok) throw new Error(`${pathOrUrl}: HTTP ${response.status}`);
  return response.text();
}

const readCentres = async (pathOrUrl: string) => JSON.parse(await readText(pathOrUrl)) as Centre[];

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

const cityArg = `city id (${Object.keys(cities).join(', ')})`;

program
  .command('centres')
  .description(
    'Write centres.json next to the CSV: every centre the CSV names, reusing UrbanLabs records and drafting new ones with TODO fields',
  )
  .argument('<city>', cityArg)
  .argument('<csv>', 'downloaded source file')
  .option('-o, --out <path>', 'output JSON (default: centres.json next to the CSV)')
  .option('--centres <pathOrUrl>', 'known UrbanLabs centre registry (default: from GitHub)')
  .action(async (city: string, csvPath: string, options: { out?: string; centres?: string }) => {
    const converter = converterFor(city);
    const known = await readCentres(options.centres ?? converter.centresUrl);
    const knownIds = new Set(known.map((c) => c.id));
    const centres = converter.centres(await readFile(csvPath, 'utf8'), known);
    const drafts = centres.filter((c) => !knownIds.has(c.id));
    for (const draft of drafts)
      console.warn(`Draft ${draft.id}: complete its TODO fields by hand before use`);
    const out = options.out ?? join(dirname(csvPath), 'centres.json');
    await writeJson(out, centres);
    console.info(`Wrote ${centres.length} centres (${drafts.length} drafts) to ${out}`);
  });

program
  .command('convert')
  .description('Write courses.json next to the CSV: UrbanLabs course records keyed by centre id')
  .argument('<city>', cityArg)
  .argument('<csv>', 'downloaded source file')
  .option('-o, --out <path>', 'output JSON (default: courses.json next to the CSV)')
  .option(
    '--centres <pathOrUrl>',
    'centre registry (default: centres.json next to the CSV, else UrbanLabs on GitHub)',
  )
  .action(async (city: string, csvPath: string, options: { out?: string; centres?: string }) => {
    const converter = converterFor(city);
    const local = join(dirname(csvPath), 'centres.json');
    const registry = options.centres ?? (existsSync(local) ? local : converter.centresUrl);
    // Drafts still carry TODO instead of a URL; their rows are reported as unmatched.
    const centres = (await readCentres(registry)).filter((c) => c.officialUrl.startsWith('https://'));
    const { centres: records, unmatched } = converter.convert(await readFile(csvPath, 'utf8'), centres);

    for (const [id, list] of Object.entries(records)) {
      const seen = new Set<string>();
      for (const r of list)
        if (seen.has(r.externalId)) console.warn(`Duplicate ${r.externalId} in ${id}`);
        else seen.add(r.externalId);
    }
    for (const [name, count] of Object.entries(unmatched))
      console.warn(`Skipped ${count} rows: no reviewed centre for "${name}"`);

    const out = options.out ?? join(dirname(csvPath), 'courses.json');
    await writeJson(out, records);
    const total = Object.values(records).reduce((n, list) => n + list.length, 0);
    console.info(`Wrote ${total} records for ${Object.keys(records).length} centres to ${out} (centres from ${registry})`);
  });

await program.parseAsync();
