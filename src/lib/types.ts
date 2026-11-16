// Mirrors UrbanLabs courseRecordSchema (src/lib/ingestion/validation/record.ts),
// which validates these records again when they are ingested.
export interface CourseRecord {
  externalId: string;
  title: string;
  officialUrl: string;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  scheduleText: string | null;
  priceCents: number | null;
  currency: 'EUR' | null;
  availability: null;
  isCancelled: boolean;
  isSoldOut: boolean;
  organizer?: string | null;
  courseLanguage: null;
}

/** One UrbanLabs centre record, as in data/centres/<country>/<city>.json (centreSchema). */
export interface Centre {
  id: string;
  officialUrl: string;
  registration: Record<string, string>;
  [field: string]: unknown;
}

export interface Conversion {
  /** Records keyed by UrbanLabs centre id. */
  centres: Record<string, CourseRecord[]>;
  /** Source rows no centre claims, counted by their centre value. */
  unmatched: Record<string, number>;
}

export interface CityConverter {
  /** Default UrbanLabs centre registry for this city. */
  centresUrl: string;
  convert(csv: string, centres: Centre[]): Conversion;
  /** Every centre the CSV names: known ones as they are, new ones as TODO drafts. */
  centres(csv: string, known: Centre[]): Centre[];
}
