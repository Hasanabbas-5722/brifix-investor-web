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
    ticker?: string;
    interval?: string;
    period?: string;
    candles: ChartCandle[];
    currentPrice: number;
    previousClose: number;
    dayHigh?: number;
    dayLow?: number;
    change?: number;
    changePercent?: number;
  };
  error?: string;
};

/**
 * Flask route `chart_bp`: GET `{API_ORIGIN}/chart-data`
 * Fetches genuine real-time and historical candlestick market data.
 */
export async function fetchChartData(params: {
  symbol?: string;
  interval?: string;
  period?: string;
}) {
  const { data } = await axios.get<ChartDataResponse>(CHART_DATA_URL, {
    params: {
      symbol: params.symbol ?? 'NIFTY 50',
      interval: params.interval ?? '1d',
      period: params.period ?? '',
    },
    timeout: 10000,
  });
  return data;
}
