import axios from 'axios';
import { CHART_DATA_URL } from './apiConfig';

export type ChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ChartDataResponse = {
  success: boolean;
  data?: {
    symbol: string;
    candles: ChartCandle[];
    currentPrice: number;
    previousClose: number;
  };
  error?: string;
};

/**
 * Flask route `chart_bp`: GET `{API_ORIGIN}/chart-data`
 * (not under `/api/v1`; see `brifix_investors_backend/app/routes/chart_routes.py`).
 */
export async function fetchChartData(params: {
  symbol?: string;
  interval?: string;
  period?: string;
}) {
  const { data } = await axios.get<ChartDataResponse>(CHART_DATA_URL, {
    params: {
      symbol: params.symbol ?? '^NSEI',
      interval: params.interval ?? '1d',
      period: params.period ?? '1mo',
    },
  });
  return data;
}
