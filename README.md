# urban-open-courses-data

Course and workshop data for [UrbanLabs](https://github.com/8beets/urbanlabs), added by hand.

Folders follow the same IDs as UrbanLabs' `data/geography.json`:

```text
<country>/<region>/<city>/
```

- `country`: lower-case ISO 3166-1 code, e.g. `es`
- `region`: region ID, e.g. `catalunya`
- `city`: city ID, e.g. `barcelona`

Add a new country, region or city as a new folder using the same kind of ID.

## Converting downloads

`src/` holds a small CLI that turns a downloaded file into UrbanLabs data. It runs in Docker
on Node 26:

```sh
docker build -t urban-courses .
CSV=es/comunidad-de-madrid/madrid/<file>.csv
docker run --rm -v "$PWD:/data" urban-courses centres madrid $CSV  # writes centres.json
docker run --rm -v "$PWD:/data" urban-courses convert madrid $CSV  # writes courses.json
docker run --rm -w /app --entrypoint npm urban-courses test
```

- `centres` writes `centres.json` next to the CSV, in UrbanLabs' centre format
  (`data/centres/<country>/<city>.json`, `centreSchema`): one record per centre the CSV
  names. Centres UrbanLabs already has are copied from its registry on GitHub (`--centres`
  for a local file). New centres become drafts whose `TODO` fields fail UrbanLabs
  validation until they are completed by hand from official sources.
- `convert` writes `courses.json` next to the CSV: UrbanLabs course records
  (`courseRecordSchema`) keyed by centre ID. It reads the local `centres.json` when there is
  one (else UrbanLabs on GitHub) and skips, with a warning, rows of draft or unknown centres.

`-o` changes either output path. To add a city, write `src/cities/<country>/<city>.ts` and
register it in `src/cli.ts`.
