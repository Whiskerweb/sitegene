#!/usr/bin/env python3
"""Extrait (token reveal, email, source, note) d'un Excel de prospection vers
JSON sur stdout. Colonnes attendues : A=source, C=note, D=lien /r/{token}, E=email.

    python3 scripts/extract-prospects-xlsx.py "/chemin/Feuille de calcul.xlsx"
"""
import sys, json, re
import openpyxl

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TOKEN_RE = re.compile(r"/r/([a-f0-9]+)")


def cell(row, i):
    return str(row[i]).strip() if len(row) > i and row[i] is not None else ""


def main():
    if len(sys.argv) < 2:
        print("usage: extract-prospects-xlsx.py <path.xlsx>", file=sys.stderr)
        sys.exit(2)
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    out = []
    for row in ws.iter_rows(values_only=True):
        link = cell(row, 3)
        email = cell(row, 4)
        m = TOKEN_RE.search(link)
        out.append({
            "token": m.group(1) if m else None,
            "email": email,
            "valid": bool(EMAIL_RE.match(email)),
            "source": cell(row, 0)[:120],
            "note": cell(row, 2)[:200],
        })
    json.dump(out, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
