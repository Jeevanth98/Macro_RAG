# economic_graphrag/ingestion/imf_loader.py
"""
IMF World Economic Outlook (WEO) DataMapper loader.
Completely free — no API key required.
API: https://www.imf.org/external/datamapper/api/v1/{INDICATOR}

Indicators fetched (all G20, actuals + IMF forecasts):
  - Real GDP Growth (%)
  - Inflation, Average Consumer Prices (%)
  - Current Account Balance (% of GDP)
  - General Government Gross Debt (% of GDP)
  - General Government Total Expenditure (% of GDP)
"""
import time
import uuid
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

# IMF ISO-3 → display name mapping
G20_COUNTRIES: Dict[str, str] = {
    "ARG": "Argentina",
    "AUS": "Australia",
    "BRA": "Brazil",
    "CAN": "Canada",
    "CHN": "China",
    "FRA": "France",
    "DEU": "Germany",
    "IND": "India",
    "IDN": "Indonesia",
    "ITA": "Italy",
    "JPN": "Japan",
    "MEX": "Mexico",
    "RUS": "Russia",
    "SAU": "Saudi Arabia",
    "ZAF": "South Africa",
    "KOR": "South Korea",
    "TUR": "Turkey",
    "GBR": "United Kingdom",
    "USA": "United States",
}

# IMF WEO indicator codes → human-readable names
IMF_INDICATORS: Dict[str, str] = {
    "NGDP_RPCH":    "GDP growth, real (annual %)",
    "PCPIPCH":      "Inflation, average consumer prices (annual %)",
    "BCA_NGDPD":    "Current account balance (% of GDP)",
    "GGXWDG_NGDP":  "General government gross debt (% of GDP)",
    "LUR":          "Unemployment rate, IMF WEO (%)",
}

_BASE_URL = "https://www.imf.org/external/datamapper/api/v1"


def _fetch_imf_indicator(code: str, name: str) -> List[Dict[str, Any]]:
    """
    Fetch one WEO indicator for all G20 countries.
    Returns a list of document dicts (one per country with data).
    """
    url = f"{_BASE_URL}/{code}"
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  IMF fetch error ({name}): {e}")
        return []

    all_values: Dict[str, Dict[str, float]] = data.get("values", {}).get(code, {})
    if not all_values:
        return []

    docs = []
    for iso3, country_name in G20_COUNTRIES.items():
        country_data = all_values.get(iso3, {})
        if not country_data:
            continue

        # Build DataFrame from {year_str: value} dict
        rows = []
        for yr_str, val in country_data.items():
            try:
                yr = int(yr_str)
                v  = float(val)
                if 2000 <= yr <= 2031 and v is not None:
                    rows.append({"year": yr, "value": v})
            except (TypeError, ValueError):
                continue

        if not rows:
            continue

        df = pd.DataFrame(rows).sort_values("year")
        latest_row   = df[df["year"] <= 2024].tail(1)
        historical   = df[df["year"] <= 2024]
        forecasts    = df[df["year"] >  2024]
        recent       = historical[historical["year"] >= 2015]

        if latest_row.empty:
            continue

        unit = "%" if "%" in name else ""
        mean_v   = historical["value"].mean()
        latest_v = float(latest_row["value"].iloc[0])
        latest_y = int(latest_row["year"].iloc[0])

        content_parts = [
            f"{name} — {country_name}",
            "=" * 60,
            f"Source: IMF World Economic Outlook DataMapper",
            f"Time range: {int(historical['year'].min())}–{int(historical['year'].max())}",
            f"Latest actual ({latest_y}): {latest_v:,.2f} {unit}",
            f"Historical average (2000–{latest_y}): {mean_v:,.2f} {unit}",
            f"Min: {historical['value'].min():,.2f}  Max: {historical['value'].max():,.2f}",
            "",
            f"Recent data (2015–{latest_y}):",
            recent.to_string(index=False),
            "",
            "Full historical data:",
            historical.to_string(index=False),
        ]
        if not forecasts.empty:
            content_parts += [
                "",
                "IMF WEO Forecasts (future years):",
                forecasts.to_string(index=False),
            ]

        docs.append({
            "document_id":     str(uuid.uuid4()),
            "title":           f"{name} — {country_name}",
            "source":          "IMF WEO DataMapper (no key)",
            "content":         "\n".join(content_parts),
            "publication_date": str(latest_y),
            "country":         country_name,
            "indicator":       name,
        })

    return docs


def load_imf_data() -> List[Dict[str, Any]]:
    """
    Fetch all IMF WEO indicators for G20 countries.
    No API key required.  Makes one HTTP request per indicator (~5 calls).
    """
    all_docs: List[Dict[str, Any]] = []

    for code, name in IMF_INDICATORS.items():
        print(f"  Fetching IMF WEO: {name} …")
        docs = _fetch_imf_indicator(code, name)
        all_docs.extend(docs)
        print(f"    → {len(docs)} country documents")
        time.sleep(0.3)   # be polite to the free API

    return all_docs
