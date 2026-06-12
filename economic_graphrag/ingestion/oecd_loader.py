# economic_graphrag/ingestion/oecd_loader.py
"""
OECD data loader — uses the OECD SDMX REST API.
Fetches GDP growth rates for G7 countries.
Falls back gracefully if the API is unreachable.
"""
import uuid
from typing import Any, Dict, List

import pandas as pd
import requests

G7_COUNTRIES = {
    "CAN": "Canada", "FRA": "France", "DEU": "Germany", "ITA": "Italy",
    "JPN": "Japan", "GBR": "United Kingdom", "USA": "United States",
}

INDICATOR_NAME = "GDP growth rate (annual %, seasonally adjusted)"


def _fetch_oecd_gdp(country_code: str) -> pd.DataFrame:
    """
    Fetches annual GDP growth from OECD using the newer OECD SDMX-JSON 1.0 API.
    Falls back to World Bank if OECD fails.
    """
    # OECD SDMX-JSON endpoint for QNA (Quarterly National Accounts)
    url = (
        f"https://sdmx.oecd.org/public/rest/data/"
        f"OECD,DF_QNA,1.0/{country_code}.B1_GE.GPSA.Q"
        f"?startPeriod=2000-Q1&format=jsondata"
    )
    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            series_data = data.get("data", {}).get("dataSets", [{}])[0]
            obs = series_data.get("series", {})
            if obs:
                # Extract time periods from structure
                dims = data["data"]["structure"]["dimensions"]["observation"]
                time_dim = next((d for d in dims if d["id"] == "TIME_PERIOD"), None)
                times = [v["id"] for v in time_dim["values"]] if time_dim else []

                records = []
                for series_key, series_val in obs.items():
                    for obs_key, obs_val in series_val.get("observations", {}).items():
                        idx = int(obs_key)
                        if idx < len(times):
                            records.append({"date": times[idx], "value": obs_val[0]})

                if records:
                    df = pd.DataFrame(records)
                    df["value"] = pd.to_numeric(df["value"], errors="coerce")
                    return df.dropna()
    except Exception as e:
        print(f"OECD API failed for {country_code}: {e}")

    # Fallback: World Bank annual GDP growth
    try:
        wb_url = f"http://api.worldbank.org/v2/country/{country_code}/indicator/NY.GDP.MKTP.KD.ZG"
        wb_resp = requests.get(wb_url, params={"format": "json", "per_page": 100, "date": "2000:2023"}, timeout=10)
        if wb_resp.status_code == 200:
            wb_data = wb_resp.json()
            if wb_data and len(wb_data) > 1 and wb_data[1]:
                records = [
                    {"date": str(e["date"]), "value": e["value"]}
                    for e in wb_data[1] if e.get("value") is not None
                ]
                if records:
                    df = pd.DataFrame(records)
                    df["value"] = pd.to_numeric(df["value"], errors="coerce")
                    return df.dropna()
    except Exception as e:
        print(f"World Bank GDP growth fallback also failed for {country_code}: {e}")

    return pd.DataFrame()


def load_oecd_data() -> List[Dict[str, Any]]:
    all_documents = []
    for code, name in G7_COUNTRIES.items():
        print(f"  Fetching GDP growth for {name} ...")
        df = _fetch_oecd_gdp(code)
        if not df.empty:
            # Recent years summary for richer content
            recent = df.sort_values("date", ascending=False).head(20)
            content = (
                f"GDP growth rate data for {name}:\n\n"
                f"{recent.to_string(index=False)}\n\n"
                f"Average GDP growth rate (all periods): {df['value'].mean():.2f}%\n"
                f"Latest period: {df.iloc[0]['date']}, value: {df.iloc[0]['value']:.2f}%"
            )
            all_documents.append({
                "document_id": str(uuid.uuid4()),
                "title": f"{INDICATOR_NAME} - {name}",
                "source": "OECD / World Bank",
                "content": content,
                "publication_date": None,
                "country": name,
                "indicator": INDICATOR_NAME,
            })
        else:
            print(f"  No data for {name}, skipping.")

    return all_documents
