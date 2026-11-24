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
| [`es/catalunya/barcelona/agenda-diaria-cursos-i-tallers.csv`](es/catalunya/barcelona/agenda-diaria-cursos-i-tallers.csv) | Ajuntament de Barcelona | [Agenda d'actes i activitats de la ciutat de Barcelona](https://opendata-ajuntament.barcelona.cat/data/dataset/agenda-diaria) (`opendatabcn_agenda-ampliada-csv.csv`, **filtered**, see below) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 2026-11-24 |

### Madrid

- **What it is.** Courses and workshops in Madrid's district cultural centres: one row per
  course group, with centre, activity, group, audience, places and a start time and
  duration per weekday. Semicolon-separated CSV, UTF-8 with BOM, CRLF line endings.
- **Why by hand.** Since 2026-11-13, `datos.madrid.es/robots.txt` disallows the portal's
  API and resource downloads for automated clients, so UrbanLabs does not fetch it
  itself. The file is downloaded by a person from the dataset page.
- **Dates.** `FECHA_DATOS_INI` / `FECHA_DATOS_FIN` give the day the data describes and
  `FX_CARGA` the day the publisher loaded it.

### Barcelona

- **What it is.** The city's daily agenda of events and activities, extended version:
  one row per event per filter/contact, with venue (`addresses_place`), category
  (`secondary_filters_fullpath`), dates, and prices inside the `timetable` HTML.
  Comma-separated CSV, UTF-16LE with BOM, CRLF line endings.
- **Why by hand.** The portal returns 403 to GitHub Actions runners for both
  `robots.txt` and the file download (the CKAN API answers), so UrbanLabs cannot fetch it
  itself ([8beets/urbanlabs#144](https://github.com/8beets/urbanlabs/issues/144)).
- **Why filtered (exception to the rule above).** The original is ~325 MB, over GitHub's
  100 MB file limit. [`scripts/filter-barcelona-agenda.py`](scripts/filter-barcelona-agenda.py)
  keeps only the rows of events filed under "Cursos i tallers" whose venue is a casal,
  library, museum or ateneu (centres cívics are left out; UrbanLabs gets them from Miram).
  Kept rows, header, encoding and line endings are copied byte-for-byte, so the file
  parses exactly like the original. To refresh it, run from a home connection:

  ```sh
  python3 scripts/filter-barcelona-agenda.py            # downloads, then filters
  python3 scripts/filter-barcelona-agenda.py file.csv   # or filter a file you downloaded
  ```

## Credits

The data belongs to its publishers and keeps their licences; this repository does not
relicense it. Anyone reusing it, including UrbanLabs, must credit the source:

- **Madrid:** Ayuntamiento de Madrid – datos.madrid.es,
  [Cursos y talleres en los centros culturales de los distritos](https://datos.madrid.es/dataset/50064-0-talleres-culturales-cursos),
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Barcelona:** Ajuntament de Barcelona – Open Data BCN,
  [Agenda d'actes i activitats de la ciutat de Barcelona](https://opendata-ajuntament.barcelona.cat/data/dataset/agenda-diaria),
  licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
