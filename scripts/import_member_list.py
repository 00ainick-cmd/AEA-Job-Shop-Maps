"""
AEA Career Finder - member list importer (layer 1).

Turns an AEA member list export (.xlsx) into data/shops.json so every member
shop appears on the map as a basic listing.

    python scripts/import_member_list.py "C:/path/to/Select_MemberList.xlsx"

What it does:
  * Keeps only the member types named in --types (default: Regular, the
    repair station members).
  * Publishes ONLY company, city, state/province, country, phone and website.
    Street address, postal code, contact names, emails, fax, dues and mailing
    preferences are read for location lookup at most and are never written out.
  * Uses the Approx_Latitude / Approx_Longitude columns when the export has
    them. Otherwise it looks the city up (OpenStreetMap Nominatim) and keeps
    the answers in data/geocode_cache.json, which is not committed.
  * Keeps what each shop told us on the member form (hiring, kinds of work,
    work-based learning, photos and so on) when the list is imported again.
    Shops are matched on the same slug the profile links use. Nothing is kept
    from a data file that is marked as sample data.

The export itself must never be committed. This project is public.
"""

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "data" / "shops.json"
CACHE_FILE = ROOT / "data" / "geocode_cache.json"

# Fields a shop supplies itself on the member form. These survive a re-import.
FORM_FIELDS = [
    "type", "address", "zip", "email", "contact", "airport", "memberSince",
    "hiring", "openingsCount", "positionTypes", "experienceLevel", "salaryRange",
    "shifts", "benefits", "about", "employeeCount", "companySize", "services",
    "specializations", "schoolPrograms", "schoolNote", "photos",
]

EMPTY_FORM = {
    "type": "Repair Station", "address": "", "zip": "", "email": None,
    "contact": None, "airport": None, "memberSince": None, "hiring": None,
    "openingsCount": None, "positionTypes": [], "experienceLevel": None,
    "salaryRange": None, "shifts": [], "benefits": [], "about": None,
    "employeeCount": None, "companySize": None, "services": [],
    "specializations": [], "schoolPrograms": [], "schoolNote": None, "photos": [],
}

HOME_COUNTRIES = {"united states", "usa", "us", "united states of america"}

# Different spellings of one country in the export, so the location filter lists it once.
COUNTRY_NAMES = {
    "republic de panama": "Panama",
    "usa": "United States",
    "united states of america": "United States",
}


def text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def slug(name, city, state):
    """Must match shopSlug() in js/config.js."""
    s = " ".join(p for p in (name, city, state) if p).lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def clean_phone(value, country):
    """First number only (some rows list two), tidied for US and Canada."""
    first = re.split(r"[/;,]| or ", text(value))[0].strip()
    if not first:
        return None
    digits = re.sub(r"\D", "", first)
    if country.lower() in HOME_COUNTRIES | {"canada"}:
        if len(digits) == 11 and digits[0] == "1":
            digits = digits[1:]
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return first


def clean_website(value):
    v = text(value)
    if not v or " " in v or "@" in v or "." not in v:
        return None
    if not re.match(r"^https?://", v, re.I):
        v = "https://" + v
    return v


def load_json(path, fallback):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return fallback


def lookup_city(city, state, country, cache):
    """City-level lookup with a cache. Returns (lat, lng) or None."""
    key = "|".join(p.lower() for p in (city, state, country))
    if key in cache:
        hit = cache[key]
        return (hit["lat"], hit["lng"]) if hit else None
    query = ", ".join(p for p in (city, state, country) if p)
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": query, "format": "json", "limit": 1})
    result = None
    for attempt in range(3):
        time.sleep(2.5 * (attempt + 1))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "shop-map-importer/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                rows = json.loads(resp.read().decode("utf-8"))
            if rows:
                result = {"lat": round(float(rows[0]["lat"]), 5), "lng": round(float(rows[0]["lon"]), 5)}
            break
        except Exception as err:  # too many requests, timeouts: wait and retry
            print(f"  lookup retry for {query}: {err}")
    cache[key] = result
    return (result["lat"], result["lng"]) if result else None


def read_rows(xlsx_path):
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = ws.iter_rows(values_only=True)
    header = [text(h) for h in next(rows)]
    for r in rows:
        if any(c is not None for c in r):
            yield dict(zip(header, r))


def main():
    ap = argparse.ArgumentParser(description="Import an AEA member list into data/shops.json")
    ap.add_argument("export", help="Path to the member list .xlsx")
    ap.add_argument("--types", default="Regular",
                    help="Comma-separated MemberType values to include (default: Regular)")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--no-lookup", action="store_true",
                    help="Skip the online city lookup; shops without a location are left out")
    args = ap.parse_args()

    wanted = {t.strip().lower() for t in args.types.split(",") if t.strip()}
    out_path = Path(args.out)

    # Form answers from the current data file, unless it is sample data.
    existing = load_json(out_path, {})
    keep = {}
    if existing.get("shops") and not existing.get("metadata", {}).get("sample", True):
        for s in existing["shops"]:
            keep[slug(s.get("name"), s.get("city"), s.get("state"))] = s

    cache = load_json(CACHE_FILE, {})
    shops, seen, skipped = [], set(), []

    for row in read_rows(args.export):
        if text(row.get("MemberType")).lower() not in wanted:
            continue
        name = text(row.get("Company"))
        city = text(row.get("City"))
        state = text(row.get("State/Province"))
        country = text(row.get("Country")) or "United States"
        country = COUNTRY_NAMES.get(country.lower(), country)
        if not name or not city:
            skipped.append((name or "(no name)", "missing company or city"))
            continue
        key = slug(name, city, state)
        if key in seen:
            skipped.append((name, "listed twice in the same city"))
            continue

        lat, lng, source = row.get("Approx_Latitude"), row.get("Approx_Longitude"), None
        if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
            source = "postal" if "postal" in text(row.get("Geocode_Method")).lower() else "city"
            cache.setdefault("|".join(p.lower() for p in (city, state, country)),
                             {"lat": round(lat, 5), "lng": round(lng, 5)})
        else:
            found = None if args.no_lookup and "|".join(
                p.lower() for p in (city, state, country)) not in cache else lookup_city(city, state, country, cache)
            if not found:
                skipped.append((name, "location not found"))
                continue
            lat, lng = found
            source = "city"

        seen.add(key)
        shop = {"id": len(shops) + 1, "name": name}
        shop.update(EMPTY_FORM)
        previous = keep.pop(key, None)
        if previous:
            for f in FORM_FIELDS:
                if f in previous:
                    shop[f] = previous[f]
        shop.update({
            "city": city,
            "state": state,
            "country": country,
            "phone": clean_phone(row.get("Phone"), country),
            "website": clean_website(row.get("Website")),
            "lat": round(float(lat), 5),
            "lng": round(float(lng), 5),
            "geocodeSource": source,
        })
        shops.append(shop)

    shops.sort(key=lambda s: s["name"].lower())
    for i, s in enumerate(shops, 1):
        s["id"] = i

    CACHE_FILE.write_text(json.dumps(cache, indent=1), encoding="utf-8")

    output = {
        "shops": shops,
        "metadata": {
            "totalShops": len(shops),
            "uniqueStates": len({(s["country"], s["state"]) for s in shops}),
            "hiringCount": sum(1 for s in shops if s["hiring"]),
            "totalOpenings": sum(s["openingsCount"] or 0 for s in shops),
            "sample": False,
            "source": "AEA member list",
            "lastUpdated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
    }
    out_path.write_text(json.dumps(output, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"Shops written: {len(shops)}")
    print(f"Countries: {len({s['country'] for s in shops})}")
    print(f"Without a website: {sum(1 for s in shops if not s['website'])}")
    print(f"Form answers carried over: {sum(1 for s in shops if s['about'] or s['hiring'] or s['services'])}")
    if skipped:
        print(f"Left out: {len(skipped)}")
        for name, why in skipped:
            print(f"  - {name}: {why}")
    if keep:
        print(f"On the map before but not in this list (dropped): {len(keep)}")
        for s in keep.values():
            print(f"  - {s.get('name')}, {s.get('city')}")


if __name__ == "__main__":
    sys.exit(main())
