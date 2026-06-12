# economic_graphrag/ingestion/worldbank_loader.py
"""
World Bank data loader — uses batch API requests (all G20 countries in one call per indicator).
76 sequential calls → 4 batch calls.
"""
import uuid
from typing import Any, Dict, List

import pandas as pd
import requests

G20_COUNTRIES = {
    "ARG": "Argentina", "AUS": "Australia", "BRA": "Brazil", "CAN": "Canada",
    "CHN": "China", "FRA": "France", "DEU": "Germany", "IND": "India",
    "IDN": "Indonesia", "ITA": "Italy", "JPN": "Japan", "MEX": "Mexico",
    "SAU": "Saudi Arabia", "ZAF": "South Africa",
    "KOR": "South Korea", "TUR": "Turkey", "GBR": "United Kingdom", "USA": "United States",
}

INDICATORS: Dict[str, str] = {
    "NY.GDP.MKTP.CD":  "GDP (current US$)",
    "FP.CPI.TOTL.ZG":  "Inflation, consumer prices (annual %)",
    "SL.UEM.TOTL.ZS":  "Unemployment rate (% of total labour force)",
    "NE.TRD.GNFS.ZS":  "Trade (% of GDP)",
    "NY.GDP.PCAP.CD":  "GDP per capita (current US$)",
    "PA.NUS.FCRF":     "Official exchange rate (LCU per US$)",
}

# All country codes joined for one batch request
_ALL_CODES = ";".join(G20_COUNTRIES.keys())


def _fetch_indicator_batch(indicator_code: str, indicator_name: str,
                            start: int = 2000, end: int = 2023) -> List[Dict[str, Any]]:
    """
    Fetch one indicator for ALL G20 countries in a single API call.
    Returns a list of documents (one per country that has data).
    """
    url = f"http://api.worldbank.org/v2/country/{_ALL_CODES}/indicator/{indicator_code}"
    params = {"format": "json", "date": f"{start}:{end}", "per_page": 2000}

    try:
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        payload = resp.json()
    except Exception as e:
        print(f"  World Bank fetch error ({indicator_name}): {e}")
        return []

    if not payload or len(payload) < 2 or not payload[1]:
        return []

    # Group by country
    by_country: Dict[str, List[Dict]] = {}
    for entry in payload[1]:
        if entry.get("value") is None:
            continue
        cname = entry["country"]["value"]
        if cname not in by_country:
            by_country[cname] = []
        by_country[cname].append({
            "year": int(entry["date"]),
            "value": float(entry["value"]),
        })

    docs = []
    for country_name, records in by_country.items():
        df = pd.DataFrame(records).sort_values("year")
        recent = df[df["year"] >= 2015]
        recent_str = recent.to_string(index=False) if not recent.empty else "(no recent data)"

        # Build a rich narrative document
        mean_val = df["value"].mean()
        latest_row = df.iloc[-1]
        unit = "%" if "%" in indicator_name or "rate" in indicator_name.lower() else "USD"

        content = (
            f"{indicator_name} — {country_name}\n"
            f"{'=' * 60}\n"
            f"Time range: {int(df['year'].min())}–{int(df['year'].max())}\n"
            f"Latest ({int(latest_row['year'])}): {latest_row['value']:,.2f} {unit}\n"
            f"Historical average: {mean_val:,.2f} {unit}\n"
            f"Min: {df['value'].min():,.2f}  Max: {df['value'].max():,.2f}\n\n"
            f"Recent data (2015–2023):\n{recent_str}\n\n"
            f"Full historical data:\n{df.to_string(index=False)}"
        )

        docs.append({
            "document_id": str(uuid.uuid4()),
            "title": f"{indicator_name} — {country_name}",
            "source": "World Bank API",
            "content": content,
            "publication_date": str(int(latest_row["year"])),
            "country": country_name,
            "indicator": indicator_name,
        })

    return docs


def load_worldbank_data() -> List[Dict[str, Any]]:
    """
    Loads World Bank data for all G20 countries using 6 batch API calls
    (one per indicator).
    """
    all_docs: List[Dict[str, Any]] = []

    for code, name in INDICATORS.items():
        print(f"  Fetching {name} for all G20 countries ...")
        docs = _fetch_indicator_batch(code, name)
        all_docs.extend(docs)
        print(f"    -> {len(docs)} country documents")

    return all_docs
