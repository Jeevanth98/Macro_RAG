# economic_graphrag/ingestion/ecb_loader.py
"""
European Central Bank (ECB) Data Portal loader.
Completely free — no API key required.
API: https://data-api.ecb.europa.eu/service/data/

Series fetched:
  - ECB Main Refinancing Operations (MRO) rate  — Eurozone key policy rate
  - ECB Deposit Facility Rate (DFR)              — floor of ECB corridor
  - EUR/USD exchange rate (daily → annual avg)   — EXR
  - HICP inflation for the Eurozone              — ICP
"""
import uuid
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import requests

_BASE   = "https://data-api.ecb.europa.eu/service/data"
_HDRS   = {
    "Accept":     "application/json",
    "User-Agent": "economic-graphrag/1.0 (educational research)",
}

# (ECB dataset/key, indicator_name, country_label, unit)
ECB_SERIES: List[Tuple[str, str, str, str]] = [
    (
        "FM/B.U2.EUR.4F.KR.MRR_FR.LEV",
        "ECB Main Refinancing Operations Rate",
        "Eurozone",
        "%",
    ),
    (
        "FM/B.U2.EUR.4F.KR.DFR.LEV",
        "ECB Deposit Facility Rate",
        "Eurozone",
        "%",
    ),
    (
        "EXR/D.USD.EUR.SP00.A",
        "EUR/USD Exchange Rate (ECB)",
        "Eurozone",
        "USD per EUR",
    ),
    (
        "ICP/M.U2.N.000000.4.ANR",
        "HICP Inflation (Eurozone, annual %)",
        "Eurozone",
        "%",
    ),
]


def _ecb_to_annual_df(url: str) -> Optional[pd.DataFrame]:
    """
    Fetch an ECB SDMX-JSON series and return an annual-average DataFrame
    with columns [year, value].
    """
    try:
        resp = requests.get(url, headers=_HDRS, params={
            "startPeriod": "2000", "endPeriod": "2024",
        }, timeout=20)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  ECB fetch error ({url[-40:]}): {e}")
        return None

    # Extract time periods from structure → observation dimension
    try:
        struct      = data.get("structure", {})
        obs_dims    = struct.get("dimensions", {}).get("observation", [])
        time_dim    = next((d for d in obs_dims if d.get("id") == "TIME_PERIOD"), None)
        if time_dim is None:
            return None
        time_values = [v["id"] for v in time_dim.get("values", [])]

        # First (and usually only) series
        datasets  = data.get("dataSets", [{}])
        if not datasets:
            return None
        series    = datasets[0].get("series", {})
        if not series:
            return None
        first_obs = list(series.values())[0].get("observations", {})

        rows = []
        for idx_str, obs_arr in first_obs.items():
            idx = int(idx_str)
            if idx >= len(time_values):
                continue
            val = obs_arr[0] if obs_arr else None
            if val is None:
                continue
            try:
                period = time_values[idx]         # e.g. "2015-03-04" or "2015-03"
                year   = int(str(period)[:4])
                rows.append({"date": period, "year": year, "value": float(val)})
            except (ValueError, TypeError):
                continue

        if not rows:
            return None

        df = pd.DataFrame(rows)
        # Annual average (handles daily and monthly data equally)
        annual = df.groupby("year")["value"].mean().reset_index()
        return annual[annual["year"] >= 2000].reset_index(drop=True)

    except Exception as e:
        print(f"  ECB parse error: {e}")
        return None


def load_ecb_data() -> List[Dict[str, Any]]:
    """
    Fetch ECB policy rates and Eurozone indicators.
    No API key required.  Makes one HTTP call per series (~4 calls).
    """
    docs: List[Dict[str, Any]] = []

    for series_key, name, country, unit in ECB_SERIES:
        url = f"{_BASE}/{series_key}"
        print(f"  Fetching ECB: {name} ...")
        df  = _ecb_to_annual_df(url)
        if df is None or df.empty:
            print(f"    -> no data returned")
            continue

        latest_row = df.tail(1)
        recent     = df[df["year"] >= 2015]
        mean_v     = df["value"].mean()
        latest_v   = float(latest_row["value"].iloc[0])
        latest_y   = int(latest_row["year"].iloc[0])

        content = "\n".join([
            f"{name} — {country}",
            "=" * 60,
            f"Source: ECB Data Portal (no API key required)",
            f"Time range: {int(df['year'].min())}–{latest_y}",
            f"Latest annual average ({latest_y}): {latest_v:.4f} {unit}",
            f"Historical average: {mean_v:.4f} {unit}",
            f"Min: {df['value'].min():.4f}  Max: {df['value'].max():.4f}",
            "",
            "Recent data (2015–present):",
            recent.to_string(index=False),
            "",
            "Full annual data:",
            df.to_string(index=False),
        ])

        docs.append({
            "document_id":     str(uuid.uuid4()),
            "title":           f"{name} — {country}",
            "source":          "ECB Data Portal (no key)",
            "content":         content,
            "publication_date": str(latest_y),
            "country":         country,
            "indicator":       name,
        })
        print(f"    -> {len(df)} annual data points")

    return docs
