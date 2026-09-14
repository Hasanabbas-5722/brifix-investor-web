'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronDown, TrendingUp, TrendingDown, BarChart2,
  Activity, Minus, RefreshCw, Search, Check, Layers,
} from 'lucide-react';
import { fetchChartData, ChartCandle } from '@/lib/services/chartService';
import SocketService from '@/lib/services/socketService';

/* ─── Types ──────────────────────────────── */
type IndicatorKey = 'MA20' | 'MA50' | 'EMA20' | 'BB' | 'RSI' | 'Volume' | 'MACD' | 'Stochastic' | 'ATR' | 'ADX';
type ChartType = 'candles' | 'line' | 'area';

/* ─── Symbol catalogue (NSE & BSE) ───────── */
interface SymbolInfo {
  label: string;
  id: string;
  category: 'Index' | 'Stock';
}

const POPULAR_INDICES = ['NIFTY50', 'BANKNIFTY', 'SENSEX', 'FINNIFTY'];

const SYMBOLS: SymbolInfo[] = [
  { label: 'NIFTY 50',      id: 'NIFTY50',    category: 'Index' },
  { label: 'BANK NIFTY',    id: 'BANKNIFTY',  category: 'Index' },
  { label: 'SENSEX',        id: 'SENSEX',     category: 'Index' },
  { label: 'FIN NIFTY',     id: 'FINNIFTY',   category: 'Index' },
  { label: 'RELIANCE',      id: 'RELIANCE',   category: 'Stock' },
  { label: 'TCS',           id: 'TCS',        category: 'Stock' },
  { label: 'HDFC BANK',     id: 'HDFCBANK',   category: 'Stock' },
  { label: 'INFOSYS',       id: 'INFY',       category: 'Stock' },
  { label: 'ICICI BANK',    id: 'ICICIBANK',  category: 'Stock' },
  { label: 'SBI',           id: 'SBIN',       category: 'Stock' },
  { label: 'BHARTI AIRTEL', id: 'BHARTIARTL', category: 'Stock' },
  { label: 'ITC',           id: 'ITC',        category: 'Stock' },
  { label: 'TATA MOTORS',   id: 'TATAMOTORS', category: 'Stock' },
  { label: 'HINDUNILVR',    id: 'HINDUNILVR', category: 'Stock' },
  { label: 'BAJAJ FINANCE', id: 'BAJFINANCE', category: 'Stock' },
  { label: 'MARUTI',        id: 'MARUTI',     category: 'Stock' },
  { label: 'WIPRO',         id: 'WIPRO',      category: 'Stock' },
  { label: 'SUN PHARMA',    id: 'SUNPHARMA',  category: 'Stock' },
  { label: 'ADANI ENT.',    id: 'ADANIENT',   category: 'Stock' },
  { label: 'TATA STEEL',    id: 'TATASTEEL',  category: 'Stock' },
  { label: 'L&T',           id: 'LT',         category: 'Stock' },
];

const TFS = [
  { v: '1m',  l: '1m' },
  { v: '5m',  l: '5m' },
  { v: '15m', l: '15m' },
  { v: '1h',  l: '1H' },
  { v: '1d',  l: '1D' },
  { v: '1wk', l: '1W' },
  { v: '1mo', l: '1M' },
];

/* ─── Indicator Calculations on Real Data ── */
function calcSMA(data: { time: number; close: number }[], period: number) {
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    out.push({ time: data[i].time, value: +(sum / period).toFixed(2) });
  }
  return out;
}

function calcEMA(data: { time: number; close: number }[], period: number) {
  const k = 2 / (period + 1);
  const out: { time: number; value: number }[] = [];
  let ema = data[0]?.close ?? 0;
  data.forEach((d, i) => {
    if (i > 0) ema = d.close * k + ema * (1 - k);
    out.push({ time: d.time, value: +ema.toFixed(2) });
  });
  return out;
}

function calcRSI(data: { time: number; close: number }[], period = 14) {
  const out: { time: number; value: number }[] = [];
  if (data.length <= period) return out;
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    out.push({ time: data[i].time, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  }
  return out;
}

function calcBB(data: { time: number; close: number }[], period = 20, mult = 2) {
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1).map(d => d.close);
    const mean  = slice.reduce((a, b) => a + b, 0) / period;
    const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    upper.push({ time: data[i].time, value: +(mean + mult * std).toFixed(2) });
    lower.push({ time: data[i].time, value: +(mean - mult * std).toFixed(2) });
  }
  return { upper, lower };
}

function calcMACD(data: { time: number; close: number }[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(data, fast);
  const emaSlow = calcEMA(data, slow);
  const macdLine: { time: number; value: number }[] = [];
  
  for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
    macdLine.push({
      time: emaFast[i].time,
      value: +(emaFast[i].value - emaSlow[i].value).toFixed(2),
    });
  }
  
  const signalLine = calcEMA(macdLine.map((d) => ({ time: d.time, close: d.value })), signal);
  const histogram: { time: number; value: number; color: string }[] = [];
  
  for (let i = 0; i < signalLine.length; i++) {
    const macdVal = macdLine[i + (macdLine.length - signalLine.length)]?.value ?? 0;
    const histVal = +(macdVal - signalLine[i].value).toFixed(2);
    histogram.push({
      time: signalLine[i].time,
      value: histVal,
      color: histVal >= 0 ? 'rgba(16,185,129,0.6)' : 'rgba(244,63,94,0.6)',
    });
  }
  
  return { macdLine, signalLine, histogram };
}

function calcStochastic(data: { time: number; high: number; low: number; close: number }[], period = 14, smooth = 3) {
  const kLine: { time: number; value: number }[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(d => d.high));
    const lowest = Math.min(...slice.map(d => d.low));
    const k = lowest === highest ? 50 : ((data[i].close - lowest) / (highest - lowest)) * 100;
    kLine.push({ time: data[i].time, value: +k.toFixed(2) });
  }
  
  const dLine: { time: number; value: number }[] = [];
  for (let i = smooth - 1; i < kLine.length; i++) {
    let sum = 0;
    for (let j = i - smooth + 1; j <= i; j++) sum += kLine[j].value;
    dLine.push({ time: kLine[i].time, value: +(sum / smooth).toFixed(2) });
  }
  
  return { kLine, dLine };
}

function calcATR(data: { time: number; high: number; low: number; close: number }[], period = 14) {
  const tr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const trueRange = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    tr.push(trueRange);
  }
  
  const atr: { time: number; value: number }[] = [];
  for (let i = period - 1; i < tr.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += tr[j];
    atr.push({ time: data[i + 1].time, value: +(sum / period).toFixed(2) });
  }
  return atr;
}

function calcADX(data: { time: number; high: number; low: number; close: number }[], period = 14) {
  const dx: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;
    const plusDM = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
    const minusDM = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;
    
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    
    const plusDI = tr === 0 ? 0 : (plusDM / tr) * 100;
    const minusDI = tr === 0 ? 0 : (minusDM / tr) * 100;
    const dxVal = plusDI + minusDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dx.push(dxVal);
  }
  
  const adx: { time: number; value: number }[] = [];
  for (let i = period - 1; i < dx.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += dx[j];
    adx.push({ time: data[i + 1].time, value: +(sum / period).toFixed(2) });
  }
  return adx;
}

/* ─── Colour palette ─────────────────────── */
const C = {
  bg:        '#0F1520',
  grid:      'rgba(255,255,255,0.04)',
  text:      '#8892B0',
  border:    'rgba(255,255,255,0.07)',
  up:        '#10B981',
  down:      '#F43F5E',
  ma20:      '#F59E0B',
  ma50:      '#818CF8',
  ema20:     '#06B6D4',
  bbLine:    'rgba(99,102,241,0.55)',
  rsi:       '#A78BFA',
  vol:       'rgba(99,102,241,0.4)',
  volUp:     'rgba(16,185,129,0.35)',
  volDown:   'rgba(244,63,94,0.35)',
  macd:      '#3B82F6',
  macdSignal: '#F59E0B',
  stochK:    '#8B5CF6',
  stochD:    '#EC4899',
  atr:       '#14B8A6',
  adx:       '#F97316',
} as const;

/* ─── Main Component ─────────────────────── */
function ChartComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get('symbol');

  const [symIdx, setSymIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [tf, setTf] = useState('1d');
  const [symOpen, setSymOpen] = useState(false);
  const [indOpen, setIndOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(
    new Set(['MA20', 'MA50', 'Volume', 'RSI']),
  );

  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ohlc, setOhlc] = useState({
    o: 0, h: 0, l: 0, c: 0, chg: 0, chgPct: 0, vol: 0,
  });
  const [chartReady, setChartReady] = useState(false);
  const [buildKey, setBuildKey] = useState(0);

  // Sync symbol param with state
  useEffect(() => {
    if (symbolParam) {
      const idx = SYMBOLS.findIndex(s => s.id.toLowerCase() === symbolParam.toLowerCase());
      if (idx !== -1) {
        setSymIdx(idx);
      }
    }
  }, [symbolParam]);

  const mainRef  = useRef<HTMLDivElement>(null);
  const rsiRef   = useRef<HTMLDivElement>(null);
  const macdRef  = useRef<HTMLDivElement>(null);
  const stochRef = useRef<HTMLDivElement>(null);
  const atrRef   = useRef<HTMLDivElement>(null);
  const adxRef   = useRef<HTMLDivElement>(null);
  const areaRef  = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartObj = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSeries = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rsiChart = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const macdChart = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stochChart = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atrChart = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adxChart = useRef<any>(null);

  const sym = SYMBOLS[symIdx];
  const showRSI = indicators.has('RSI');
  const showMACD = indicators.has('MACD');
  const showStoch = indicators.has('Stochastic');
  const showATR = indicators.has('ATR');
  const showADX = indicators.has('ADX');

  const toggleInd = (k: IndicatorKey) =>
    setIndicators(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  // Filtered symbols for dropdown search
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return SYMBOLS;
    const q = searchQuery.toLowerCase();
    return SYMBOLS.filter(s => s.label.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }, [searchQuery]);

  /* ── 1. Fetch Real Historical Market Candles ── */
  useEffect(() => {
    let active = true;
    const loadMarketData = async () => {
      setLoading(true);
      try {
        const res = await fetchChartData({
          symbol: sym.label,
          interval: tf,
        });

        if (!active) return;

        if (res.success && res.data && res.data.candles?.length) {
          const list = res.data.candles;
          setCandles(list);

          const last = list[list.length - 1];
          const prevClose = res.data.previousClose || (list.length > 1 ? list[list.length - 2].close : last.open);
          const chg = res.data.change !== undefined ? res.data.change : (last.close - prevClose);
          const chgPct = res.data.changePercent !== undefined ? res.data.changePercent : ((chg / prevClose) * 100);

          setOhlc({
            o: last.open,
            h: res.data.dayHigh || last.high,
            l: res.data.dayLow || last.low,
            c: res.data.currentPrice || last.close,
            chg: +chg.toFixed(2),
            chgPct: +chgPct.toFixed(2),
            vol: last.volume,
          });
        }
      } catch (err) {
        console.error('Error fetching market chart data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMarketData();
    return () => { active = false; };
  }, [sym.label, tf, buildKey]);

  /* ── 2. Real-Time WebSocket & Polling Tick Updates ── */
  useEffect(() => {
    const socketService = SocketService.getInstance();
    const socket = socketService.connect();

    if (socket) {
      socketService.subscribeToChart({ symbol: sym.label, interval: tf, period: '' });
      socketService.subscribeToIndexes({ tokens: [sym.label, 'Nifty 50', 'Nifty Bank'] });

      const handleIndexTick = (data: any) => {
        if (!data) return;
        const symName = (data.symbol || '').toUpperCase();
        const currentSym = sym.label.toUpperCase();
        const currentId = sym.id.toUpperCase();

        const match =
          symName === currentSym ||
          symName === currentId ||
          (currentSym.includes('NIFTY 50') && data.token === '99926000') ||
          (currentSym.includes('BANK NIFTY') && data.token === '99926009') ||
          (currentSym.includes('FIN NIFTY') && data.token === '99926037') ||
          (currentSym.includes('SENSEX') && data.token === '99919000');

        if (match && data.ltp) {
          const livePrice = Number(data.ltp);
          setOhlc(prev => {
            const chg = prev.c > 0 ? +(livePrice - (prev.c - prev.chg)).toFixed(2) : prev.chg;
            const prevClose = prev.c - prev.chg;
            const chgPct = prevClose > 0 ? +((chg / prevClose) * 100).toFixed(2) : prev.chgPct;
            return {
              ...prev,
              c: livePrice,
              h: Math.max(prev.h, livePrice),
              l: prev.l > 0 ? Math.min(prev.l, livePrice) : livePrice,
              chg,
              chgPct,
            };
          });

          // Update active candlestick directly in lightweight-charts for 0-latency feedback
          if (mainSeries.current && candles.length > 0) {
            const lastCandle = candles[candles.length - 1];
            const updated = {
              time: lastCandle.time as any,
              open: lastCandle.open,
              high: Math.max(lastCandle.high, livePrice),
              low: Math.min(lastCandle.low, livePrice),
              close: livePrice,
            };
            try {
              mainSeries.current.update(chartType === 'candles' ? updated : { time: updated.time, value: livePrice });
            } catch {
              // ignore safe update errors
            }
          }
        }
      };

      socket.on('indexes_data', handleIndexTick);
      socket.on('chart_data', (payload: any) => {
        if (payload?.candle) {
          const c = payload.candle;
          setOhlc(prev => ({
            ...prev,
            c: c.close,
            h: Math.max(prev.h, c.high),
            l: prev.l > 0 ? Math.min(prev.l, c.low) : c.low,
            vol: c.volume,
          }));
        }
      });

      return () => {
        socket.off('indexes_data', handleIndexTick);
        socket.off('chart_data');
        socketService.unsubscribeFromChart();
      };
    }
  }, [sym.label, sym.id, tf, candles, chartType]);

  // Periodic fast background sync (every 5 seconds) to ensure prices stay fresh
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetchChartData({ symbol: sym.label, interval: tf });
        if (res.success && res.data?.currentPrice) {
          const ltp = res.data.currentPrice;
          const chg = res.data.change ?? 0;
          const chgPct = res.data.changePercent ?? 0;
          setOhlc(prev => ({
            ...prev,
            c: ltp,
            h: res.data?.dayHigh || Math.max(prev.h, ltp),
            l: res.data?.dayLow || (prev.l > 0 ? Math.min(prev.l, ltp) : ltp),
            chg: +chg.toFixed(2),
            chgPct: +chgPct.toFixed(2),
          }));
        }
      } catch {
        // silent background sync
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [sym.label, tf]);

  /* ── 3. Build & Render Lightweight Charts ─ */
  useEffect(() => {
    let destroyed = false;
    let ro: ResizeObserver | null = null;

    const buildChart = async () => {
      if (!mainRef.current || !areaRef.current || candles.length === 0) return;

      // Clean up previous charts
      chartObj.current?.remove();
      rsiChart.current?.remove();
      macdChart.current?.remove();
      stochChart.current?.remove();
      atrChart.current?.remove();
      adxChart.current?.remove();
      chartObj.current = null;
      rsiChart.current = null;
      macdChart.current = null;
      stochChart.current = null;
      atrChart.current = null;
      adxChart.current = null;

      if (destroyed) return;

      const {
        createChart, CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, CrosshairMode,
      } = await import('lightweight-charts');

      if (destroyed) return;

      const totalH = areaRef.current.clientHeight;
      const totalW = areaRef.current.clientWidth;

      const activeSubCharts = [showRSI, showMACD, showStoch, showATR, showADX].filter(Boolean).length;
      const labelH = 22;
      const subChartH = activeSubCharts > 0 ? Math.floor((totalH * 0.35) / activeSubCharts) : 0;
      const mainH = Math.max(200, totalH - (activeSubCharts * (subChartH + labelH)));

      mainRef.current.style.width  = `${totalW}px`;
      mainRef.current.style.height = `${mainH}px`;

      const chart = createChart(mainRef.current, {
        width:  totalW,
        height: mainH,
        layout: { background: { color: C.bg }, textColor: C.text, fontSize: 11 },
        grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor:  C.border,
          scaleMargins: { top: 0.08, bottom: indicators.has('Volume') ? 0.22 : 0.05 },
        },
        timeScale: { borderColor: C.border, timeVisible: true, secondsVisible: false },
        localization: {
          locale: 'en-IN',
          dateFormat: 'dd MMM yyyy',
        },
      });
      chartObj.current = chart;

      type LCTime = import('lightweight-charts').Time;
      const toTime = (t: number) => t as unknown as LCTime;

      // Render selected primary chart type
      if (chartType === 'candles') {
        const series = chart.addSeries(CandlestickSeries, {
          upColor: C.up, downColor: C.down,
          borderUpColor: C.up, borderDownColor: C.down,
          wickUpColor: C.up, wickDownColor: C.down,
        });
        series.setData(candles.map(c => ({
          time: toTime(c.time), open: c.open, high: c.high, low: c.low, close: c.close,
        })));
        mainSeries.current = series;
      } else if (chartType === 'line') {
        const series = chart.addSeries(LineSeries, {
          color: '#38BDF8', lineWidth: 2,
        });
        series.setData(candles.map(c => ({ time: toTime(c.time), value: c.close })));
        mainSeries.current = series;
      } else if (chartType === 'area') {
        const series = chart.addSeries(AreaSeries, {
          topColor: 'rgba(56,189,248,0.4)',
          bottomColor: 'rgba(56,189,248,0.0)',
          lineColor: '#38BDF8',
          lineWidth: 2,
        });
        series.setData(candles.map(c => ({ time: toTime(c.time), value: c.close })));
        mainSeries.current = series;
      }

      // Volume histogram
      if (indicators.has('Volume')) {
        const volSeries = chart.addSeries(HistogramSeries, {
          color: C.vol, priceFormat: { type: 'volume' }, priceScaleId: 'vol',
        });
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
        volSeries.setData(candles.map(c => ({
          time: toTime(c.time), value: c.volume,
          color: c.close >= c.open ? C.volUp : C.volDown,
        })));
      }

      const closeData = candles.map(c => ({ time: c.time, close: c.close }));
      const fullData = candles.map(c => ({ time: c.time, high: c.high, low: c.low, close: c.close }));

      // Moving Averages & Bands
      if (indicators.has('MA20') && closeData.length >= 20) {
        const s = chart.addSeries(LineSeries, { color: C.ma20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcSMA(closeData, 20).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('MA50') && closeData.length >= 50) {
        const s = chart.addSeries(LineSeries, { color: C.ma50, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcSMA(closeData, 50).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('EMA20') && closeData.length >= 20) {
        const s = chart.addSeries(LineSeries, { color: C.ema20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcEMA(closeData, 20).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('BB') && closeData.length >= 20) {
        const bb = calcBB(closeData);
        const bbU = chart.addSeries(LineSeries, { color: C.bbLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
        const bbL = chart.addSeries(LineSeries, { color: C.bbLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
        bbU.setData(bb.upper.map(d => ({ time: toTime(d.time), value: d.value })));
        bbL.setData(bb.lower.map(d => ({ time: toTime(d.time), value: d.value })));
      }

      chart.timeScale().fitContent();

      const subCharts: any[] = [];

      // ── Sub-charts (RSI, MACD, Stochastic, ATR, ADX) ──
      if (showRSI && rsiRef.current && closeData.length > 14) {
        rsiRef.current.style.width  = `${totalW}px`;
        rsiRef.current.style.height = `${subChartH}px`;
        const rsi = createChart(rsiRef.current, {
          width: totalW, height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        rsiChart.current = rsi;
        subCharts.push(rsi);

        const rsiSeries = rsi.addSeries(LineSeries, { color: C.rsi, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        rsiSeries.setData(calcRSI(closeData).map(d => ({ time: toTime(d.time), value: d.value })));
        rsiSeries.createPriceLine({ price: 70, color: 'rgba(244,63,94,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' });
        rsiSeries.createPriceLine({ price: 30, color: 'rgba(16,185,129,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' });
        rsi.timeScale().fitContent();
      }

      if (showMACD && macdRef.current && closeData.length > 26) {
        macdRef.current.style.width  = `${totalW}px`;
        macdRef.current.style.height = `${subChartH}px`;
        const macd = createChart(macdRef.current, {
          width: totalW, height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        macdChart.current = macd;
        subCharts.push(macd);

        const macdData = calcMACD(closeData);
        const histSeries = macd.addSeries(HistogramSeries, { priceFormat: { type: 'price', precision: 2, minMove: 0.01 } });
        histSeries.setData(macdData.histogram.map(d => ({ time: toTime(d.time), value: d.value, color: d.color })));
        const macdLineSeries = macd.addSeries(LineSeries, { color: C.macd, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        macdLineSeries.setData(macdData.macdLine.map(d => ({ time: toTime(d.time), value: d.value })));
        const signalLineSeries = macd.addSeries(LineSeries, { color: C.macdSignal, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        signalLineSeries.setData(macdData.signalLine.map(d => ({ time: toTime(d.time), value: d.value })));
        macd.timeScale().fitContent();
      }

      if (showStoch && stochRef.current && fullData.length > 14) {
        stochRef.current.style.width  = `${totalW}px`;
        stochRef.current.style.height = `${subChartH}px`;
        const stoch = createChart(stochRef.current, {
          width: totalW, height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        stochChart.current = stoch;
        subCharts.push(stoch);

        const stochData = calcStochastic(fullData);
        const kSeries = stoch.addSeries(LineSeries, { color: C.stochK, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        kSeries.setData(stochData.kLine.map(d => ({ time: toTime(d.time), value: d.value })));
        const dSeries = stoch.addSeries(LineSeries, { color: C.stochD, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        dSeries.setData(stochData.dLine.map(d => ({ time: toTime(d.time), value: d.value })));
        kSeries.createPriceLine({ price: 80, color: 'rgba(244,63,94,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' });
        kSeries.createPriceLine({ price: 20, color: 'rgba(16,185,129,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' });
        stoch.timeScale().fitContent();
      }

      if (showATR && atrRef.current && fullData.length > 14) {
        atrRef.current.style.width  = `${totalW}px`;
        atrRef.current.style.height = `${subChartH}px`;
        const atr = createChart(atrRef.current, {
          width: totalW, height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        atrChart.current = atr;
        subCharts.push(atr);

        const atrData = calcATR(fullData);
        const atrSeries = atr.addSeries(LineSeries, { color: C.atr, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        atrSeries.setData(atrData.map(d => ({ time: toTime(d.time), value: d.value })));
        atr.timeScale().fitContent();
      }

      if (showADX && adxRef.current && fullData.length > 14) {
        adxRef.current.style.width  = `${totalW}px`;
        adxRef.current.style.height = `${subChartH}px`;
        const adx = createChart(adxRef.current, {
          width: totalW, height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        adxChart.current = adx;
        subCharts.push(adx);

        const adxData = calcADX(fullData);
        const adxSeries = adx.addSeries(LineSeries, { color: C.adx, lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
        adxSeries.setData(adxData.map(d => ({ time: toTime(d.time), value: d.value })));
        adxSeries.createPriceLine({ price: 25, color: 'rgba(16,185,129,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'Strong' });
        adx.timeScale().fitContent();
      }

      // Synchronize scroll / pan
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) subCharts.forEach(sc => sc.timeScale().setVisibleLogicalRange(range));
      });
      subCharts.forEach(sc => {
        sc.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
          if (range) chart.timeScale().setVisibleLogicalRange(range);
        });
      });

      // Responsive Resize
      ro = new ResizeObserver(() => {
        if (!areaRef.current || !mainRef.current) return;
        const newTotal = areaRef.current.clientHeight;
        const newW     = areaRef.current.clientWidth;
        const newSubH  = activeSubCharts > 0 ? Math.floor((newTotal * 0.35) / activeSubCharts) : 0;
        const newMainH = Math.max(200, newTotal - (activeSubCharts * (newSubH + labelH)));

        mainRef.current.style.width  = `${newW}px`;
        mainRef.current.style.height = `${newMainH}px`;
        chartObj.current?.applyOptions({ width: newW, height: newMainH });

        [rsiChart, macdChart, stochChart, atrChart, adxChart].forEach((ref, idx) => {
          const divRef = [rsiRef, macdRef, stochRef, atrRef, adxRef][idx];
          if (ref.current && divRef.current) {
            divRef.current.style.width = `${newW}px`;
            divRef.current.style.height = `${newSubH}px`;
            ref.current.applyOptions({ width: newW, height: newSubH });
          }
        });
      });
      ro.observe(areaRef.current);

      setChartReady(true);
    };

    let frame1: number, frame2: number;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => { buildChart(); });
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      ro?.disconnect();
      chartObj.current?.remove();
      rsiChart.current?.remove();
      macdChart.current?.remove();
      stochChart.current?.remove();
      atrChart.current?.remove();
      adxChart.current?.remove();
      chartObj.current = null;
      rsiChart.current = null;
      macdChart.current = null;
      stochChart.current = null;
      atrChart.current = null;
      adxChart.current = null;
    };
  }, [candles, indicators, chartType, buildKey]);

  const up = ohlc.chg >= 0;

  const handleManualRefresh = () => {
    setRefreshing(true);
    setBuildKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div
      className="chart-container-height"
      style={{
        display: 'flex', flexDirection: 'column',
        background: C.bg, overflow: 'hidden',
      }}
      onClick={() => { setSymOpen(false); setIndOpen(false); setTypeOpen(false); }}
    >
      {/* ── Top Toolbar ─────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 16px', height: 52, flexShrink: 0,
          background: '#111724', borderBottom: '1px solid var(--border)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Quick Index Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {POPULAR_INDICES.map(idxId => {
            const indexItem = SYMBOLS.find(s => s.id === idxId);
            if (!indexItem) return null;
            const active = sym.id === idxId;
            return (
              <button
                key={idxId}
                onClick={() => {
                  const targetIdx = SYMBOLS.findIndex(s => s.id === idxId);
                  setSymIdx(targetIdx);
                  router.push(`/chart?symbol=${idxId}`);
                }}
                style={{
                  height: 30, padding: '0 10px', borderRadius: 8,
                  fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  border: active ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'var(--accent-dim)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--accent-light)' : 'var(--text-2)',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {indexItem.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Searchable Symbol Selector */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: symOpen ? 220 : 30 }}>
          <button
            onClick={() => { setSymOpen(v => !v); setIndOpen(false); setTypeOpen(false); }}
            style={{
              height: 32, padding: '0 12px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-1)', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{sym.label}</span>
            <ChevronDown
              size={13}
              color="var(--text-3)"
              style={{
                transform: symOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {symOpen && (
            <div
              className="fade-in"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                width: 270, background: '#161E2E',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                zIndex: 9999, maxHeight: 360, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Search filter */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0F1520', padding: '6px 10px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <Search size={13} color="var(--text-3)" />
                  <input
                    type="text"
                    placeholder="Search stocks / indices..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: 'var(--text-1)', fontSize: 12, width: '100%',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredSymbols.map((s) => {
                  const originalIdx = SYMBOLS.findIndex(x => x.id === s.id);
                  const isSelected = originalIdx === symIdx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSymIdx(originalIdx);
                        setSymOpen(false);
                        setSearchQuery('');
                        router.push(`/chart?symbol=${s.id}`);
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        fontSize: 12, fontWeight: isSelected ? 800 : 500,
                        color: isSelected ? 'var(--accent-light)' : 'var(--text-2)',
                        background: isSelected ? 'var(--accent-dim)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'background 0.1s',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{s.category} · NSE</div>
                      </div>
                      {isSelected && <Check size={14} color="var(--accent-light)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0, background: '#0F1520', padding: 2, borderRadius: 8, border: '1px solid var(--border)' }}>
          {TFS.map(t => (
            <button
              key={t.v}
              onClick={() => setTf(t.v)}
              style={{
                height: 26, padding: '0 9px', borderRadius: 6,
                fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none',
                background: tf === t.v ? 'var(--accent)' : 'transparent',
                color: tf === t.v ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Chart style toggle (Candles, Line, Area) */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: typeOpen ? 220 : 30 }}>
          <button
            onClick={() => { setTypeOpen(v => !v); setIndOpen(false); setSymOpen(false); }}
            style={{
              height: 28, padding: '0 10px', borderRadius: 6,
              background: typeOpen ? 'var(--bg-elevated)' : 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Layers size={13} />
            <span style={{ textTransform: 'capitalize' }}>{chartType}</span>
          </button>

          {typeOpen && (
            <div
              className="fade-in"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                width: 140, background: '#161E2E',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                zIndex: 9999, padding: 4,
              }}
            >
              {(['candles', 'line', 'area'] as ChartType[]).map(ct => (
                <button
                  key={ct}
                  onClick={() => { setChartType(ct); setTypeOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '7px 10px',
                    borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: chartType === ct ? 'var(--accent-dim)' : 'transparent',
                    color: chartType === ct ? 'var(--accent-light)' : 'var(--text-2)',
                    fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                  }}
                >
                  {ct}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators dropdown */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: indOpen ? 220 : 30 }}>
          <button
            onClick={() => { setIndOpen(v => !v); setSymOpen(false); setTypeOpen(false); }}
            style={{
              height: 28, padding: '0 10px', borderRadius: 6,
              background: indOpen ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${indOpen ? 'var(--border-strong)' : 'var(--border)'}`,
              color: indOpen ? 'var(--accent-light)' : 'var(--text-2)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Activity size={13} /> Indicators
          </button>

          {indOpen && (
            <div
              className="fade-in"
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                width: 220, background: '#161E2E',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10,
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                zIndex: 9999, padding: 8,
              }}
            >
              {(
                [
                  { k: 'MA20',   label: 'MA 20',           color: C.ma20  },
                  { k: 'MA50',   label: 'MA 50',           color: C.ma50  },
                  { k: 'EMA20',  label: 'EMA 20',          color: C.ema20 },
                  { k: 'BB',     label: 'Bollinger Bands', color: '#6366F1' },
                  { k: 'RSI',    label: 'RSI (14)',        color: C.rsi   },
                  { k: 'MACD',   label: 'MACD (12,26,9)',  color: C.macd  },
                  { k: 'Stochastic', label: 'Stochastic (14,3)', color: C.stochK },
                  { k: 'ATR',    label: 'ATR (14)',        color: C.atr   },
                  { k: 'ADX',    label: 'ADX (14)',        color: C.adx   },
                  { k: 'Volume', label: 'Volume',          color: C.up    },
                ] as { k: IndicatorKey; label: string; color: string }[]
              ).map(ind => (
                <button
                  key={ind.k}
                  onClick={() => toggleInd(ind.k)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 7, border: 'none',
                    background: indicators.has(ind.k) ? 'rgba(99,102,241,0.1)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                >
                  <span style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    background: indicators.has(ind.k) ? ind.color : 'var(--bg-elevated)',
                    border: `1.5px solid ${ind.color}`,
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: indicators.has(ind.k) ? 'var(--text-1)' : 'var(--text-3)',
                  }}>
                    {ind.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Feed Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20, padding: '3px 9px', flexShrink: 0, marginLeft: 'auto',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)' }}>LIVE MARKET</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          title="Refresh Data"
          style={{
            height: 28, width: 28, borderRadius: 6, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* ── Real Market Stats & OHLC Bar ─────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          padding: '8px 18px', background: C.bg,
          borderBottom: '1px solid var(--border)', flexShrink: 0,
          position: 'relative', zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {sym.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>NSE · {tf.toUpperCase()}</span>
        </div>

        {/* Current Live Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="nums" style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-1)' }}>
            ₹{ohlc.c.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>

          <span
            className="nums"
            style={{
              fontSize: 12, fontWeight: 800,
              padding: '2px 8px', borderRadius: 6,
              background: up ? 'var(--green-bg)' : 'var(--red-bg)',
              color: up ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? '+' : ''}{ohlc.chg} ({up ? '+' : ''}{ohlc.chgPct}%)
          </span>
        </div>

        {/* OHLC Values */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginLeft: 8 }}>
          {([
            { l: 'O', v: ohlc.o },
            { l: 'H', v: ohlc.h },
            { l: 'L', v: ohlc.l },
            { l: 'C', v: ohlc.c },
          ] as const).map(item => (
            <span key={item.l} style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--text-3)', marginRight: 4 }}>{item.l}</span>
              <span className="nums" style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                {item.v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          ))}
        </div>

        {/* Volume */}
        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
          Vol:{' '}
          <span className="nums" style={{ color: 'var(--text-2)', fontWeight: 700 }}>
            {ohlc.vol >= 10000000 ? `${(ohlc.vol / 1e7).toFixed(2)}Cr` : `${(ohlc.vol / 1e5).toFixed(2)}L`}
          </span>
        </span>
      </div>

      {/* ── Chart Rendering Area ─────────────────────────────────── */}
      <div
        ref={areaRef}
        style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 1,
        }}
        onClick={e => e.stopPropagation()}
      >
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,21,32,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 50, gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, border: '3px solid var(--accent)',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
              Loading real market data for {sym.label}...
            </span>
          </div>
        )}

        {/* Main chart canvas */}
        <div ref={mainRef} style={{ width: '100%', flexShrink: 0 }} />

        {/* RSI Sub-chart */}
        {showRSI && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.rsi, background: C.bg, flexShrink: 0 }}>
              RSI (14)
            </div>
            <div ref={rsiRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* MACD Sub-chart */}
        {showMACD && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.macd, background: C.bg, flexShrink: 0 }}>
              MACD (12,26,9)
            </div>
            <div ref={macdRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* Stochastic Sub-chart */}
        {showStoch && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.stochK, background: C.bg, flexShrink: 0 }}>
              Stochastic (14,3)
            </div>
            <div ref={stochRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* ATR Sub-chart */}
        {showATR && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.atr, background: C.bg, flexShrink: 0 }}>
              ATR (14)
            </div>
            <div ref={atrRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* ADX Sub-chart */}
        {showADX && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.adx, background: C.bg, flexShrink: 0 }}>
              ADX (14)
            </div>
            <div ref={adxRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}
      </div>

      {/* ── Legend Bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '6px 16px', background: '#111724',
        borderTop: '1px solid var(--border)', flexShrink: 0,
        minHeight: 28,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.up, display: 'inline-block' }} /> Bullish
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.down, display: 'inline-block' }} /> Bearish
        </span>
        {indicators.has('MA20')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ma20  }}><Minus size={12} /> MA 20</span>}
        {indicators.has('MA50')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ma50  }}><Minus size={12} /> MA 50</span>}
        {indicators.has('EMA20')  && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ema20 }}><Minus size={12} /> EMA 20</span>}
        {indicators.has('BB')     && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6366F1' }}><Minus size={12} /> BB (20,2)</span>}
        {indicators.has('RSI')    && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.rsi }}><Minus size={12} /> RSI</span>}
        {indicators.has('MACD')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.macd }}><Minus size={12} /> MACD</span>}
        {indicators.has('Volume') && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.up }}><BarChart2 size={11} /> Volume</span>}

        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>
          Live Market Feed · NSE / BSE · Real-time Analytics
        </span>
      </div>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#0F1520', color: '#8892B0'
      }}>
        Loading chart...
      </div>
    }>
      <ChartComponent />
    </Suspense>
  );
}
