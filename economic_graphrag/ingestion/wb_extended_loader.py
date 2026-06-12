# economic_graphrag/ingestion/wb_extended_loader.py
"""
World Bank Extended data loader — additional indicators beyond the core set.
Completely free — no API key required.
Same batch API as the core World Bank loader.

New indicators added:
  - Foreign direct investment, net inflows (% of GDP)
  - Central government debt, total (% of GDP)
  - Population, total
  - GDP per capita, PPP (current international $)
  - Gross capital formation (% of GDP)
  - Current account balance (% of GDP)
  - Military expenditure (% of GDP)
  - Research & development expenditure (% of GDP)
  - Access to electricity (% of population)
  - CO2 emissions (metric tons per capita)
"""
import uuid
from typing import Any, Dict, List

import pandas as pd
import requests

# Use same G20 mapping as core loader
G20_COUNTRIES: Dict[str, str] = {
    "ARG": "Argentina",    "AUS": "Australia",  "BRA": "Brazil",
    "CAN": "Canada",       "CHN": "China",       "FRA": "France",
    "DEU": "Germany",      "IND": "India",       "IDN": "Indonesia",
    "ITA": "Italy",        "JPN": "Japan",       "MEX": "Mexico",
    "SAU": "Saudi Arabia", "ZAF": "South Africa","KOR": "Korea, Rep.",
    "TUR": "Turkiye",      "GBR": "United Kingdom","USA": "United States",
}

EXTENDED_INDICATORS: Dict[str, str] = {
    "BX.KLT.DINV.WD.GD.ZS": "Foreign direct investment, net inflows (% of GDP)",
    "GC.DOD.TOTL.GD.ZS":     "Central government debt, total (% of GDP)",
    "SP.POP.TOTL":            "Population, total",
    "NY.GDP.PCAP.PP.CD":      "GDP per capita, PPP (current international $)",
    "NE.GDI.TOTL.ZS":         "Gross capital formation (% of GDP)",
    "BN.CAB.XOKA.GD.ZS":      "Current account balance (% of GDP)",
    "MS.MIL.XPND.GD.ZS":      "Military expenditure (% of GDP)",
    "GB.XPD.RSDV.GD.ZS":      "Research and development expenditure (% of GDP)",
    "EG.ELC.ACCS.ZS":         "Access to electricity (% of population)",
    "EN.ATM.CO2E.PC":          "CO2 emissions (metric tons per capita)",
}

_ALL_CODES = ";".join(G20_COUNTRIES.keys())


def _fetch_wb_extended(indicator_code: str, indicator_name: str,
                        start: int = 2000, end: int = 2023) -> List[Dict[str, Any]]:
    """
    Fetch one indicator for ALL G20 countries in a single World Bank batch call.
    """
    url = f"http://api.worldbank.org/v2/country/{_ALL_CODES}/indicator/{indicator_code}"
    params = {"format": "json", "date": f"{start}:{end}", "per_page": 2000}

    try:
        resp = requests.get(url, params=params, timeout=25)
        resp.raise_for_status()
        payload = resp.json()
    except Exception as e:
        print(f"  WB Extended fetch error ({indicator_name}): {e}")
        return []

    if not payload or len(payload) < 2 or not payload[1]:
        return []

    # Group records by country name
    by_country: Dict[str, List[Dict]] = {}
    for entry in payload[1]:
        if entry.get("value") is None:
            continue
        cname = entry["country"]["value"]
        if cname not in by_country:
            by_country[cname] = []
        by_country[cname].append({
            "year":  int(entry["date"]),
            "value": float(entry["value"]),
        })

    docs = []
    for country_name, records in by_country.items():
        df = pd.DataFrame(records).sort_values("year")
        if df.empty:
            continue

        recent     = df[df["year"] >= 2015]
        latest_row = df.iloc[-1]
        mean_v     = df["value"].mean()

        is_pct    = "%" in indicator_name
        is_pop    = "Population" in indicator_name
        unit      = "%" if is_pct else ("people" if is_pop else "")

        # Scale population to billions / millions for readability
        display_df = df.copy()
        if is_pop:
            display_df["value"] = display_df["value"] / 1e6
            unit = "millions"

        content = "\n".join([
            f"{indicator_name} — {country_name}",
            "=" * 60,
            f"Source: World Bank Open Data (extended indicators)",
            f"Time range: {int(df['year'].min())}–{int(df['year'].max())}",
            f"Latest ({int(latest_row['year'])}): {latest_row['value']:,.2f} {unit}",
            f"Historical average: {mean_v:,.2f} {unit}",
            f"Min: {df['value'].min():,.2f}  Max: {df['value'].max():,.2f}",
            "",
            "Recent data (2015–present):",
            display_df[display_df["year"] >= 2015].to_string(index=False),
            "",
            "Full historical data:",
            display_df.to_string(index=False),
        ])

        docs.append({
            "document_id":     str(uuid.uuid4()),
            "title":           f"{indicator_name} — {country_name}",
            "source":          "World Bank Open Data (extended)",
            "content":         content,
            "publication_date": str(int(latest_row["year"])),
            "country":         country_name,
            "indicator":       indicator_name,
        })

    return docs


def load_wb_extended_data() -> List[Dict[str, Any]]:
    """
    Fetch extended World Bank indicators for all G20 countries.
    No API key required.  Makes one HTTP request per indicator (~10 calls).
    """
    all_docs: List[Dict[str, Any]] = []

    for code, name in EXTENDED_INDICATORS.items():
        print(f"  Fetching WB Extended: {name} ...")
        docs = _fetch_wb_extended(code, name)
        all_docs.extend(docs)
        print(f"    -> {len(docs)} country documents")

    return all_docs
