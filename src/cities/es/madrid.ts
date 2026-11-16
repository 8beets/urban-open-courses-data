import { createHash } from 'node:crypto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { csvObjects } from '../../lib/csv.ts';
import type { Centre, CityConverter, Conversion, CourseRecord } from '../../lib/types.ts';

// Port of UrbanLabs src/lib/ingestion/adapters/madrid-datos-cursos.ts for the
// hand-downloaded "50064 talleres culturales cursos" CSV. Ids, titles and schedules
// must stay identical to the adapter so editions keep their identity.

const DAYS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
// "lunes" … "domingo"; 1 January 2024 was a Monday.
const DAY_NAMES = DAYS.map((_, d) => format(new Date(2024, 0, 1 + d), 'EEEE', { locale: es }));
const dayList = new Intl.ListFormat('es', { type: 'conjunction' });

type Row = Record<string, string>;

/** "Lunes y miércoles, 19:00 (1 hora)", or per day when times differ. */
export function madridSchedule(row: Row): string | null {
  const sessions = DAYS.flatMap((day, i) => {
    const start = row[`HORA_INICIO_${day}`];
    if (!start) return [];
    const length = row[`DURACION_ACTIVIDAD_${day}`]?.toLocaleLowerCase('es');
    return [{ day: DAY_NAMES[i]!, time: length ? `${start} (${length})` : start }];
  });
  if (!sessions.length) return null;
  const capitalise = (text: string) => text[0]!.toUpperCase() + text.slice(1);
  if (sessions.every((s) => s.time === sessions[0]!.time))
    return `${capitalise(dayList.format(sessions.map((s) => s.day)))}, ${sessions[0]!.time}`;
  return capitalise(sessions.map((s) => `${s.day} ${s.time}`).join('; '));
}

/** Slug of the activity plus a hash of activity, group and audience (no ids in the dataset). */
export function madridExternalId(row: Row): string {
  const key = [row.ACTIVIDAD_DESC, row.GRUPO_DESC, row.DESTINATARIO_DESC].join('\u0000');
  const slug = slugify(row.ACTIVIDAD_DESC!).slice(0, 60);
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 12);
  return `${slug || 'curso'}-${hash}`;
}

const PLATFORM = 'madrid-datos-cursos';

const madridRows = (csv: string) =>
  csvObjects(csv, [
    'ORGANISMO_DESC',
    'ACTIVIDAD_DESC',
    'GRUPO_DESC',
    'DESTINATARIO_DESC',
    'NUM_PLAZAS_LIBRES',
    ...DAYS.flatMap((d) => [`DURACION_ACTIVIDAD_${d}`, `HORA_INICIO_${d}`]),
  ]);

const byOrganism = (centres: Centre[]) =>
  new Map(
    centres
      .filter((c) => c.registration.platform === PLATFORM)
      .map((c) => [c.registration.organism, c]),
  );

const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A centreSchema record whose TODO fields fail UrbanLabs validation until reviewed by hand. */
function draftCentre(organism: string): Centre {
  const slug = slugify(organism.replace(/^C\.C\.\s*/, 'centro cultural '));
  return {
    id: `cc-mad-${slug}`,
    slug,
    name: `TODO official name of ${organism} (district)`,
    officialUrl: 'TODO madrid.es page',
    address: 'TODO street, postcode Madrid',
    country: 'ES',
    city: 'Madrid',
    cityId: 'madrid',
    timezone: 'Europe/Madrid',
    profile: {},
    registration: {
      platform: PLATFORM,
      origin: 'https://datos.madrid.es',
      organism,
      verifiedAt: 'TODO yyyy-mm-dd',
    },
  };
}

export const madrid: CityConverter = {
  centresUrl:
    'https://raw.githubusercontent.com/8beets/urbanlabs/main/data/centres/es/madrid.json',
  centres(csv, known) {
    const centres = byOrganism(known);
    const organisms = new Set(madridRows(csv).map((row) => row.ORGANISMO_DESC!));
    return [...organisms]
      .map((organism) => centres.get(organism) ?? draftCentre(organism))
      .sort((a, b) => a.id.localeCompare(b.id));
  },
  convert(csv, known) {
    const centres = byOrganism(known);
    const out: Conversion = { centres: {}, unmatched: {} };
    for (const row of madridRows(csv)) {
      const centre = centres.get(row.ORGANISMO_DESC!);
      if (!centre) {
        out.unmatched[row.ORGANISMO_DESC!] = (out.unmatched[row.ORGANISMO_DESC!] ?? 0) + 1;
        continue;
      }
      const record: CourseRecord = {
        externalId: madridExternalId(row),
        title: row.ACTIVIDAD_DESC!,
        officialUrl: centre.officialUrl,
        category: null,
        startDate: null,
        endDate: null,
        scheduleText: madridSchedule(row),
        priceCents: null,
        currency: null,
        availability: null,
        isCancelled: false,
        isSoldOut: row.NUM_PLAZAS_LIBRES === '0',
        courseLanguage: null,
      };
      (out.centres[centre.id] ??= []).push(record);
    }
    return out;
  },
};
