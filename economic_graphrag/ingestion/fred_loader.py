# economic_graphrag/ingestion/fred_loader.py
"""
FRED data loader — fetches key US macro series.
Requires FRED_API_KEY environment variable.
"""
import uuid
from typing import Any, Dict, List

import pandas as pd
import requests

from economic_graphrag.config import settings

FRED_SERIES: Dict[str, str] = {
    "CPIAUCSL":  "Consumer Price Index (CPI, All Urban Consumers)",
    "FEDFUNDS":  "Effective Federal Funds Rate",
    "UNRATE":    "Civilian Unemployment Rate",
    "DGS10":     "10-Year Treasury Constant Maturity Rate",
    "GDP":       "Gross Domestic Product (US, Billions of Dollars)",
    "GDPC1":     "Real GDP (Chained 2017 Dollars)",
    "M2SL":      "M2 Money Stock",
    "T10YIE":    "10-Year Breakeven Inflation Rate",
}


def _fetch_series(series_id: str, api_key: str, start: str = "2000-01-01") -> pd.DataFrame:
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "observation_start": start,
        "sort_order": "desc",
        "limit": 500,
    }
    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if "observations" in data:
            df = pd.DataFrame(data["observations"])[["date", "value"]]
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df["date"] = pd.to_datetime(df["date"])
            return df.dropna().sort_values("date")
    except Exception as e:
        print(f"  FRED error ({series_id}): {e}")
    return pd.DataFrame()


def load_fred_data() -> List[Dict[str, Any]]:
    if not settings.FRED_API_KEY:
        print("  Skipping FRED: FRED_API_KEY not set.")
        return []

    all_docs: List[Dict[str, Any]] = []
    for series_id, series_name in FRED_SERIES.items():
        print(f"  Fetching {series_name} (FRED: {series_id}) ...")
        df = _fetch_series(series_id, settings.FRED_API_KEY)
        if df.empty:
            continue

        recent = df.tail(60)
        latest = df.iloc[-1]

        content = (
            f"{series_name} — United States (FRED series: {series_id})\n"
            f"{'=' * 60}\n"
            f"Time range: {df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}\n"
            f"Latest value ({latest['date'].strftime('%Y-%m-%d')}): {latest['value']:.4f}\n"
            f"Mean: {df['value'].mean():.4f}  Min: {df['value'].min():.4f}  Max: {df['value'].max():.4f}\n\n"
            f"Recent observations (last 60):\n{recent.to_string(index=False)}\n"
        )

        all_docs.append({
            "document_id": str(uuid.uuid4()),
            "title": f"{series_name} — United States",
            "source": "FRED API (Federal Reserve Bank of St. Louis)",
            "content": content,
            "publication_date": latest["date"].strftime("%Y-%m-%d"),
            "country": "United States",
            "indicator": series_name,
        })
        print(f"    -> {len(df)} observations loaded")

    return all_docs
