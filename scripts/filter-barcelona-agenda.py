#!/usr/bin/env python3
"""Regenerate es/catalunya/barcelona/agenda-diaria-cursos-i-tallers.csv.

The published agenda-ampliada CSV (~325 MB) is over GitHub's 100 MB file limit, so this
keeps only the rows of events filed under "Cursos i tallers" whose venue (addresses_place)
is a casal, library, museum or ateneu (8beets/urbanlabs#144). Kept rows, the header,
UTF-16LE + BOM encoding and CRLF row endings are copied byte-for-byte.

Usage: python3 scripts/filter-barcelona-agenda.py [downloaded.csv]
Without an argument it downloads the file (works from a home connection; the portal
returns 403 to GitHub Actions runners).
"""
import csv
import re
import shutil
import sys
import tempfile
import urllib.request
from pathlib import Path

URL = ("https://opendata-ajuntament.barcelona.cat/data/dataset/"
       "a25e60cd-3083-4252-9fce-81f733871cb1/resource/"
       "ffa6d773-7998-4e0f-8e98-c80abce7126f/download")
OUT = Path(__file__).resolve().parent.parent / "es/catalunya/barcelona/agenda-diaria-cursos-i-tallers.csv"
CATEGORY = "Cursos i tallers"
# Centres cívics are skipped (e.g. "Centre Cívic Ateneu Fort Pienc"): UrbanLabs gets them from Miram.
VENUE = re.compile(r"^(?!.*centre c[ií]vic).*\b(casal|biblioteca|museu|ateneu)\b", re.I)
BOM = "\ufeff"


def filter_agenda(text):
    assert text.startswith(BOM), "expected a UTF-16 BOM"
    lines = text[1:].split("\r\n")
    trailing = lines[-1] == ""
    if trailing:
        lines.pop()
    header = next(csv.reader([lines[0]]))
    rid, path, place = (header.index(c) for c in ("register_id", "secondary_filters_fullpath", "addresses_place"))
    rows = []
    for line in lines[1:]:
        fields = next(csv.reader([line]))
        # A CRLF inside a quoted field would split a row; fail rather than write a broken file.
        assert len(fields) == len(header), f"row has {len(fields)} fields, expected {len(header)}: {line[:80]}"
        rows.append((fields[rid], CATEGORY in fields[path] and bool(VENUE.search(fields[place])), line))
    keep = {r for r, match, _ in rows if match}
    kept = [line for r, _, line in rows if r in keep]
    out = BOM + "\r\n".join([lines[0]] + kept) + ("\r\n" if trailing else "")
    return out, len(keep), len(kept), len({r for r, _, _ in rows})


def main():
    if len(sys.argv) > 1:
        src = Path(sys.argv[1])
    else:
        src = Path(tempfile.mkdtemp()) / "agenda-ampliada.csv"
        print(f"downloading to {src}")
        with urllib.request.urlopen(URL) as r, open(src, "wb") as f:
            shutil.copyfileobj(r, f)
    text = src.read_bytes().decode("utf-16-le")
    out, events, rows, total = filter_agenda(text)
    assert events, f"no '{CATEGORY}' events at matching venues found; has the format changed?"
    OUT.write_bytes(out.encode("utf-16-le"))
    print(f"kept {events} of {total} events ({rows} rows) -> {OUT} ({OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
