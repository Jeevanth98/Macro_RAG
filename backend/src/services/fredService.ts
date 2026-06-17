import axios from 'axios';

const FRED_API_KEY = process.env.FRED_API_KEY;
const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export async function fetchFredSeries(seriesId: string, limit = 12) {
  if (!FRED_API_KEY) {
    throw new Error('FRED_API_KEY is not set in the environment variables.');
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        sort_order: 'desc',
        limit: limit,
      },
    });

    const observations = response.data.observations;
    // Observations are returned descending, so reverse to ascending
    return observations.reverse().map((obs: any) => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }));
  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    throw error;
  }
}
