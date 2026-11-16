# urban-open-courses-data

Original course and workshop data for [UrbanLabs](https://github.com/8beets/urbanlabs),
downloaded by hand from official open-data portals when a source cannot be fetched
automatically.

This repository holds **only the original files, exactly as published**. It does no parsing
or conversion: UrbanLabs reads these files and its source adapters parse, validate and
normalise them, as they would a live download.

## Layout

Folders follow the same IDs as UrbanLabs' `data/geography.json`:

```text
<country>/<region>/<city>/
```

- `country`: lower-case ISO 3166-1 code, e.g. `es`
- `region`: region ID, e.g. `catalunya`
- `city`: city ID, e.g. `barcelona`

Add a new country, region or city as a new folder using the same kind of ID.

## Adding or updating a file

1. Download the file by hand from the publisher's official page (listed below).
2. Commit it unchanged: same bytes, encoding and line endings. Do not fix, trim or
   reformat anything; UrbanLabs handles the source format.
3. To update a dataset, replace the file in place under the **same name**, since UrbanLabs
   reads that path. Git history keeps earlier downloads.
4. For a new dataset, add a row to [Sources](#sources) with the publisher, dataset page,
   licence and download date, and check that the licence allows reuse.

## Sources

| File | Publisher | Dataset | Licence | Downloaded |
| ---- | --------- | ------- | ------- | ---------- |
| [`es/comunidad-de-madrid/madrid/50064-45-talleres-culturales-cursos.csv`](es/comunidad-de-madrid/madrid/50064-45-talleres-culturales-cursos.csv) | Ayuntamiento de Madrid | [Cursos y talleres en los centros culturales de los distritos](https://datos.madrid.es/dataset/50064-0-talleres-culturales-cursos) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Added 2026-11-16 (the file's own dates: data 14/11/2026, loaded 15/11/2026) |

### Madrid

- **What it is.** Courses and workshops in Madrid's district cultural centres: one row per
  course group, with centre, activity, group, audience, places and a start time and
  duration per weekday. Semicolon-separated CSV, UTF-8 with BOM, CRLF line endings.
- **Why by hand.** Since 2026-11-13, `datos.madrid.es/robots.txt` disallows the portal's
  API and resource downloads for automated clients, so UrbanLabs does not fetch it
  itself. The file is downloaded by a person from the dataset page.
- **Dates.** `FECHA_DATOS_INI` / `FECHA_DATOS_FIN` give the day the data describes and
  `FX_CARGA` the day the publisher loaded it.

## Credits

The data belongs to its publishers and keeps their licences; this repository does not
relicense it. Anyone reusing it, including UrbanLabs, must credit the source:

- **Madrid:** Ayuntamiento de Madrid – datos.madrid.es,
  [Cursos y talleres en los centros culturales de los distritos](https://datos.madrid.es/dataset/50064-0-talleres-culturales-cursos),
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
