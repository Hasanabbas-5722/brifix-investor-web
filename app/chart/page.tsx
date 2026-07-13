'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronDown, TrendingUp, TrendingDown, BarChart2,
  Activity, Minus, RefreshCw,
} from 'lucide-react';

/* ─── Types ──────────────────────────────── */
type IndicatorKey = 'MA20' | 'MA50' | 'EMA20' | 'BB' | 'RSI' | 'Volume' | 'MACD' | 'Stochastic' | 'ATR' | 'ADX';

/* ─── Symbol catalogue ───────────────────── */
const SYMBOLS = [
  { label: 'NIFTY 50',      id: 'NIFTY50',    base: 24346, vol: 180 },
  { label: 'BANK NIFTY',    id: 'BANKNIFTY',  base: 52418, vol: 420 },
  { label: 'SENSEX',        id: 'SENSEX',     base: 80218, vol: 600 },
  { label: 'FIN NIFTY',     id: 'FINNIFTY',   base: 25120, vol: 200 },
  { label: 'RELIANCE',      id: 'RELIANCE',   base: 2912,  vol: 22  },
  { label: 'TCS',           id: 'TCS',        base: 3485,  vol: 18  },
  { label: 'HDFC BANK',     id: 'HDFCBANK',   base: 1582,  vol: 12  },
  { label: 'INFOSYS',       id: 'INFY',       base: 1423,  vol: 14  },
  { label: 'ICICI BANK',    id: 'ICICIBANK',  base: 1082,  vol: 10  },
  { label: 'SBI',           id: 'SBIN',       base: 812,   vol: 8   },
  { label: 'BHARTI AIRTEL', id: 'BHARTIARTL', base: 1642,  vol: 11  },
  { label: 'ITC',           id: 'ITC',        base: 468,   vol: 5   },
  { label: 'TATA MOTORS',   id: 'TATAMOTORS', base: 985,   vol: 9   },
  { label: 'BAJAJ FINANCE', id: 'BAJFINANCE', base: 7240,  vol: 55  },
  { label: 'MARUTI',        id: 'MARUTI',     base: 12450, vol: 95  },
  { label: 'WIPRO',         id: 'WIPRO',      base: 485,   vol: 6   },
  { label: 'SUN PHARMA',    id: 'SUNPHARMA',  base: 1156,  vol: 9   },
  { label: 'ADANI ENT.',    id: 'ADANIENT',   base: 3245,  vol: 28  },
];

const TFS = [
  { v: '1D', l: '1D', days: 365   },
  { v: '1W', l: '1W', days: 730   },
  { v: '1M', l: '1M', days: 1825  },
  { v: '3M', l: '3M', days: 5475  },
];

/* ─── Seeded PRNG ────────────────────────── */
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* ─── Realistic OHLCV generator ─────────── */
function generateCandles(
  base: number, volBase: number, days: number, seed: number,
) {
  const candles: {
    time: number; open: number; high: number; low: number; close: number; volume: number;
  }[] = [];
  const rand = makePrng(seed);
  let price = base * (0.65 + rand() * 0.1);
  const now = Math.floor(Date.now() / 1000);
  const DAY = 86400;

  for (let i = days; i >= 0; i--) {
    const ts = now - i * DAY;
    const d = new Date(ts * 1000);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const trend  = Math.sin(i / 60) * 0.0008 + 0.0002;
    const change = (rand() - 0.48 + trend) * volBase * 0.8;
    const open   = price;
    const close  = Math.max(open * 0.85, open + change);
    const swing  = Math.abs(change) * (0.5 + rand() * 1.2);
    const high   = Math.max(open, close) + swing * (0.3 + rand() * 0.7);
    const low    = Math.min(open, close) - swing * (0.3 + rand() * 0.7);
    const volume = Math.round((volBase * 1e5) * (0.5 + rand() * 1.5));

    candles.push({
      time: ts,
      open:   +open.toFixed(2),
      high:   +high.toFixed(2),
      low:    +low.toFixed(2),
      close:  +close.toFixed(2),
      volume,
    });
    price = close;
  }
  return candles;
}

/* ─── Indicators ─────────────────────────── */
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
  
  const signalLine = calcEMA(macdLine.map((d, i) => ({ time: d.time, close: d.value })), signal);
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
    const trueRange = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
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

/* ─── Main component ─────────────────────── */
function ChartComponent() {
  const [symIdx,    setSymIdx]    = useState(0);
  const searchParams = useSearchParams();
  const symbolParam = searchParams.get('symbol');

  useEffect(() => {
    if (symbolParam) {
      const idx = SYMBOLS.findIndex(s => s.id.toLowerCase() === symbolParam.toLowerCase());
      if (idx !== -1) {
        setSymIdx(idx);
      }
    }
  }, [symbolParam]);

  const [tf,        setTf]        = useState('1D');
  const [symOpen,   setSymOpen]   = useState(false);
  const [indOpen,   setIndOpen]   = useState(false);
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(
    new Set(['MA20', 'MA50', 'Volume', 'RSI']),
  );
  const [ohlc, setOhlc] = useState({
    o: 0, h: 0, l: 0, c: 0, chg: 0, chgPct: 0, vol: 0,
  });
  const [chartReady, setChartReady] = useState(false);
  const [buildKey,   setBuildKey]   = useState(0); // manual refresh trigger

  const mainRef  = useRef<HTMLDivElement>(null);
  const rsiRef   = useRef<HTMLDivElement>(null);
  const macdRef  = useRef<HTMLDivElement>(null);
  const stochRef = useRef<HTMLDivElement>(null);
  const atrRef   = useRef<HTMLDivElement>(null);
  const adxRef   = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartObj = useRef<any>(null);
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

  const sym   = SYMBOLS[symIdx];
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

  /* ── ref to the outer chart-area wrapper ── */
  const areaRef = useRef<HTMLDivElement>(null);

  /* ── Build / rebuild chart ─────────────── */
  useEffect(() => {
    let destroyed = false;
    let ro: ResizeObserver | null = null;

    const buildChart = async () => {
      if (!mainRef.current || !areaRef.current) return;

      // Destroy previous instances first
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
        createChart, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode,
      } = await import('lightweight-charts');

      if (destroyed) return;

      // ── Calculate layout heights ───────────────────────────────
      const totalH = areaRef.current.clientHeight;
      const totalW = areaRef.current.clientWidth;
      
      const activeSubCharts = [showRSI, showMACD, showStoch, showATR, showADX].filter(Boolean).length;
      const labelH = 22;
      const subChartH = activeSubCharts > 0 ? Math.floor((totalH * 0.35) / activeSubCharts) : 0;
      const mainH = totalH - (activeSubCharts * (subChartH + labelH));

      // Apply explicit pixel sizes
      mainRef.current.style.width  = `${totalW}px`;
      mainRef.current.style.height = `${mainH}px`;

      // ── Generate data ───────────────────────────────────────────
      const tfCfg   = TFS.find(t => t.v === tf) ?? TFS[0];
      const candles = generateCandles(sym.base, sym.vol, tfCfg.days, symIdx * 1000 + tfCfg.days);

      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const chg  = last.close - prev.close;
      setOhlc({
        o: last.open, h: last.high, l: last.low, c: last.close,
        chg: +chg.toFixed(2),
        chgPct: +(chg / prev.close * 100).toFixed(2),
        vol: last.volume,
      });

      // ── Main chart ─────────────────────────────────────────────
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
      });
      chartObj.current = chart;

      type LCTime = import('lightweight-charts').Time;
      const toTime = (t: number) => t as unknown as LCTime;

      // Candlestick
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: C.up, downColor: C.down,
        borderUpColor: C.up, borderDownColor: C.down,
        wickUpColor: C.up, wickDownColor: C.down,
      });
      candleSeries.setData(candles.map(c => ({
        time: toTime(c.time), open: c.open, high: c.high, low: c.low, close: c.close,
      })));

      // Volume
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

      if (indicators.has('MA20')) {
        const s = chart.addSeries(LineSeries, { color: C.ma20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcSMA(closeData, 20).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('MA50')) {
        const s = chart.addSeries(LineSeries, { color: C.ma50, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcSMA(closeData, 50).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('EMA20')) {
        const s = chart.addSeries(LineSeries, { color: C.ema20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        s.setData(calcEMA(closeData, 20).map(d => ({ time: toTime(d.time), value: d.value })));
      }
      if (indicators.has('BB')) {
        const bb = calcBB(closeData);
        const bbU = chart.addSeries(LineSeries, { color: C.bbLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
        const bbL = chart.addSeries(LineSeries, { color: C.bbLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
        bbU.setData(bb.upper.map(d => ({ time: toTime(d.time), value: d.value })));
        bbL.setData(bb.lower.map(d => ({ time: toTime(d.time), value: d.value })));
      }

      chart.timeScale().fitContent();

      const fullData = candles.map(c => ({ time: c.time, high: c.high, low: c.low, close: c.close }));
      const subCharts: any[] = [];

      // ── RSI sub-chart ───────────────────────────────────────────
      if (showRSI && rsiRef.current) {
        rsiRef.current.style.width  = `${totalW}px`;
        rsiRef.current.style.height = `${subChartH}px`;
        
        const rsi = createChart(rsiRef.current, {
          width:  totalW,
          height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        rsiChart.current = rsi;
        subCharts.push(rsi);

        const rsiSeries = rsi.addSeries(LineSeries, {
          color: C.rsi, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        rsiSeries.setData(calcRSI(closeData).map(d => ({ time: toTime(d.time), value: d.value })));
        rsiSeries.createPriceLine({ price: 70, color: 'rgba(244,63,94,0.55)',   lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OB' });
        rsiSeries.createPriceLine({ price: 30, color: 'rgba(16,185,129,0.55)',  lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OS' });
        rsiSeries.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.12)', lineWidth: 1, lineStyle: 1, axisLabelVisible: false, title: '' });
        rsi.timeScale().fitContent();
      }

      // ── MACD sub-chart ──────────────────────────────────────────
      if (showMACD && macdRef.current) {
        macdRef.current.style.width  = `${totalW}px`;
        macdRef.current.style.height = `${subChartH}px`;
        
        const macd = createChart(macdRef.current, {
          width:  totalW,
          height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        macdChart.current = macd;
        subCharts.push(macd);

        const macdData = calcMACD(closeData);
        
        const histSeries = macd.addSeries(HistogramSeries, {
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        });
        histSeries.setData(macdData.histogram.map(d => ({ time: toTime(d.time), value: d.value, color: d.color })));
        
        const macdLineSeries = macd.addSeries(LineSeries, {
          color: C.macd, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        macdLineSeries.setData(macdData.macdLine.map(d => ({ time: toTime(d.time), value: d.value })));
        
        const signalLineSeries = macd.addSeries(LineSeries, {
          color: C.macdSignal, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        signalLineSeries.setData(macdData.signalLine.map(d => ({ time: toTime(d.time), value: d.value })));
        
        macd.timeScale().fitContent();
      }

      // ── Stochastic sub-chart ────────────────────────────────────
      if (showStoch && stochRef.current) {
        stochRef.current.style.width  = `${totalW}px`;
        stochRef.current.style.height = `${subChartH}px`;
        
        const stoch = createChart(stochRef.current, {
          width:  totalW,
          height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        stochChart.current = stoch;
        subCharts.push(stoch);

        const stochData = calcStochastic(fullData);
        
        const kSeries = stoch.addSeries(LineSeries, {
          color: C.stochK, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        kSeries.setData(stochData.kLine.map(d => ({ time: toTime(d.time), value: d.value })));
        
        const dSeries = stoch.addSeries(LineSeries, {
          color: C.stochD, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        dSeries.setData(stochData.dLine.map(d => ({ time: toTime(d.time), value: d.value })));
        
        kSeries.createPriceLine({ price: 80, color: 'rgba(244,63,94,0.55)',   lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OB' });
        kSeries.createPriceLine({ price: 20, color: 'rgba(16,185,129,0.55)',  lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OS' });
        
        stoch.timeScale().fitContent();
      }

      // ── ATR sub-chart ───────────────────────────────────────────
      if (showATR && atrRef.current) {
        atrRef.current.style.width  = `${totalW}px`;
        atrRef.current.style.height = `${subChartH}px`;
        
        const atr = createChart(atrRef.current, {
          width:  totalW,
          height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        atrChart.current = atr;
        subCharts.push(atr);

        const atrData = calcATR(fullData);
        
        const atrSeries = atr.addSeries(LineSeries, {
          color: C.atr, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        atrSeries.setData(atrData.map(d => ({ time: toTime(d.time), value: d.value })));
        
        atr.timeScale().fitContent();
      }

      // ── ADX sub-chart ───────────────────────────────────────────
      if (showADX && adxRef.current) {
        adxRef.current.style.width  = `${totalW}px`;
        adxRef.current.style.height = `${subChartH}px`;
        
        const adx = createChart(adxRef.current, {
          width:  totalW,
          height: subChartH,
          layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
          grid:   { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          timeScale: { borderColor: C.border, timeVisible: false, visible: false },
        });
        adxChart.current = adx;
        subCharts.push(adx);

        const adxData = calcADX(fullData);
        
        const adxSeries = adx.addSeries(LineSeries, {
          color: C.adx, lineWidth: 2, priceLineVisible: false, lastValueVisible: true,
        });
        adxSeries.setData(adxData.map(d => ({ time: toTime(d.time), value: d.value })));
        
        adxSeries.createPriceLine({ price: 25, color: 'rgba(16,185,129,0.55)',  lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'Strong' });
        
        adx.timeScale().fitContent();
      }

      // Sync scroll for all sub-charts
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range) {
          subCharts.forEach(sc => sc.timeScale().setVisibleLogicalRange(range));
        }
      });
      
      subCharts.forEach(sc => {
        sc.timeScale().subscribeVisibleLogicalRangeChange((range: any) => {
          if (range) chart.timeScale().setVisibleLogicalRange(range);
        });
      });

      // ── ResizeObserver ──────────────────────────────────────────
      ro = new ResizeObserver(() => {
        if (!areaRef.current || !mainRef.current) return;
        const newTotal = areaRef.current.clientHeight;
        const newW     = areaRef.current.clientWidth;
        
        const newActiveSubCharts = [showRSI, showMACD, showStoch, showATR, showADX].filter(Boolean).length;
        const newSubChartH = newActiveSubCharts > 0 ? Math.floor((newTotal * 0.35) / newActiveSubCharts) : 0;
        const newMainH = newTotal - (newActiveSubCharts * (newSubChartH + labelH));

        mainRef.current.style.width  = `${newW}px`;
        mainRef.current.style.height = `${newMainH}px`;
        chartObj.current?.applyOptions({ width: newW, height: newMainH });

        if (showRSI && rsiRef.current && rsiChart.current) {
          rsiRef.current.style.width  = `${newW}px`;
          rsiRef.current.style.height = `${newSubChartH}px`;
          rsiChart.current.applyOptions({ width: newW, height: newSubChartH });
        }
        
        if (showMACD && macdRef.current && macdChart.current) {
          macdRef.current.style.width  = `${newW}px`;
          macdRef.current.style.height = `${newSubChartH}px`;
          macdChart.current.applyOptions({ width: newW, height: newSubChartH });
        }
        
        if (showStoch && stochRef.current && stochChart.current) {
          stochRef.current.style.width  = `${newW}px`;
          stochRef.current.style.height = `${newSubChartH}px`;
          stochChart.current.applyOptions({ width: newW, height: newSubChartH });
        }
        
        if (showATR && atrRef.current && atrChart.current) {
          atrRef.current.style.width  = `${newW}px`;
          atrRef.current.style.height = `${newSubChartH}px`;
          atrChart.current.applyOptions({ width: newW, height: newSubChartH });
        }
        
        if (showADX && adxRef.current && adxChart.current) {
          adxRef.current.style.width  = `${newW}px`;
          adxRef.current.style.height = `${newSubChartH}px`;
          adxChart.current.applyOptions({ width: newW, height: newSubChartH });
        }
      });
      ro.observe(areaRef.current);

      setChartReady(true);
    };

    // Wait for two animation frames — first frame commits layout,
    // second frame guarantees clientHeight is non-zero.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symIdx, tf, indicators, buildKey]);

  const up = ohlc.chg >= 0;

  /* ─── Shared button hover helpers ───────── */
  const hoverBg  = (e: React.MouseEvent<HTMLButtonElement>, on: boolean) => {
    e.currentTarget.style.background = on ? 'var(--bg-hover)' : 'transparent';
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: 'calc(100dvh - 64px)',
        background: C.bg, overflow: 'hidden',
      }}
      onClick={() => { setSymOpen(false); setIndOpen(false); }}
    >

      {/* ── Top toolbar ─────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 14px', height: 50, flexShrink: 0,
          background: C.bg, borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Symbol picker */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => { setSymOpen(v => !v); setIndOpen(false); }}
            style={{
              height: 32, padding: '0 12px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-1)', fontSize: 13, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {sym.label}
            <ChevronDown
              size={12}
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
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                width: 210, background: '#161E2E',
                border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
                zIndex: 200, maxHeight: 300, overflowY: 'auto',
              }}
            >
              {SYMBOLS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setSymIdx(i); setSymOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 14px',
                    fontSize: 12, fontWeight: i === symIdx ? 800 : 500,
                    color: i === symIdx ? 'var(--accent-light)' : 'var(--text-2)',
                    background: i === symIdx ? 'var(--accent-dim)' : 'transparent',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (i !== symIdx) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (i !== symIdx) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontWeight: 800 }}>{s.id}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

        {/* Timeframe buttons */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {TFS.map(t => (
            <button
              key={t.v}
              onClick={() => setTf(t.v)}
              style={{
                height: 28, padding: '0 10px', borderRadius: 6,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: tf === t.v ? 'var(--accent)' : 'transparent',
                color:      tf === t.v ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (tf !== t.v) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
              onMouseLeave={e => { if (tf !== t.v) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

        {/* Indicators dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => { setIndOpen(v => !v); setSymOpen(false); }}
            style={{
              height: 28, padding: '0 10px', borderRadius: 6,
              background: indOpen ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${indOpen ? 'var(--border-strong)' : 'transparent'}`,
              color: 'var(--text-2)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Activity size={13} /> Indicators
          </button>

          {indOpen && (
            <div
              className="fade-in"
              style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4,
                width: 190, background: '#161E2E',
                border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
                zIndex: 200, padding: 8,
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
                  onMouseEnter={e => { if (!indicators.has(ind.k)) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!indicators.has(ind.k)) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    background: indicators.has(ind.k) ? ind.color : 'var(--bg-elevated)',
                    border: `1.5px solid ${ind.color}`,
                    transition: 'background 0.15s',
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

        {/* Refresh */}
        <button
          onClick={() => setBuildKey(k => k + 1)}
          title="Refresh"
          style={{
            height: 28, width: 28, borderRadius: 6, border: 'none',
            background: 'transparent', color: 'var(--text-3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}
          onMouseEnter={e => hoverBg(e, true)}
          onMouseLeave={e => hoverBg(e, false)}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── OHLC info bar ────────────────────────────────────────── */}
      {chartReady && (
        <div
          className="fade-in"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            padding: '5px 16px', background: C.bg,
            borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{sym.id}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>NSE · {tf}</span>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(['O', 'H', 'L', 'C'] as const).map((lbl, idx) => {
              const val = [ohlc.o, ohlc.h, ohlc.l, ohlc.c][idx];
              return (
                <span key={lbl} style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-3)', marginRight: 3 }}>{lbl}</span>
                  <span className="nums" style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                    {val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              );
            })}
          </div>

          <span className="nums" style={{ fontSize: 13, fontWeight: 800, color: up ? 'var(--green)' : 'var(--red)' }}>
            {up ? '+' : ''}{ohlc.chg} ({up ? '+' : ''}{ohlc.chgPct}%)
          </span>
          {up
            ? <TrendingUp  size={14} color="var(--green)" />
            : <TrendingDown size={14} color="var(--red)"  />
          }

          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
            Vol:{' '}
            <span className="nums" style={{ color: 'var(--text-2)', fontWeight: 600 }}>
              {(ohlc.vol / 1e5).toFixed(2)}L
            </span>
          </span>
        </div>
      )}

      {/* ── Chart area ───────────────────────────────────────────── */}
      <div
        ref={areaRef}
        style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Main chart container */}
        <div ref={mainRef} style={{ width: '100%', flexShrink: 0 }} />

        {/* RSI sub-chart */}
        {showRSI && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.rsi, background: C.bg, flexShrink: 0 }}>
              RSI (14)
            </div>
            <div ref={rsiRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* MACD sub-chart */}
        {showMACD && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.macd, background: C.bg, flexShrink: 0 }}>
              MACD (12,26,9)
            </div>
            <div ref={macdRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* Stochastic sub-chart */}
        {showStoch && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.stochK, background: C.bg, flexShrink: 0 }}>
              Stochastic (14,3)
            </div>
            <div ref={stochRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* ATR sub-chart */}
        {showATR && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.atr, background: C.bg, flexShrink: 0 }}>
              ATR (14)
            </div>
            <div ref={atrRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}

        {/* ADX sub-chart */}
        {showADX && (
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.adx, background: C.bg, flexShrink: 0 }}>
              ADX (14)
            </div>
            <div ref={adxRef} style={{ width: '100%', flexShrink: 0 }} />
          </div>
        )}
      </div>

      {/* ── Legend bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '5px 16px', background: C.bg,
        borderTop: '1px solid var(--border)', flexShrink: 0,
        minHeight: 28,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.up,   display: 'inline-block' }} /> Bullish
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-3)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: C.down, display: 'inline-block' }} /> Bearish
        </span>
        {indicators.has('MA20')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ma20  }}><Minus size={12} /> MA 20</span>}
        {indicators.has('MA50')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ma50  }}><Minus size={12} /> MA 50</span>}
        {indicators.has('EMA20')  && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.ema20 }}><Minus size={12} /> EMA 20</span>}
        {indicators.has('BB')     && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6366F1' }}><Minus size={12} /> BB (20,2)</span>}
        {indicators.has('RSI')    && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.rsi }}><Minus size={12} /> RSI</span>}
        {indicators.has('MACD')   && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.macd }}><Minus size={12} /> MACD</span>}
        {indicators.has('Stochastic') && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.stochK }}><Minus size={12} /> Stochastic</span>}
        {indicators.has('ATR')    && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.atr }}><Minus size={12} /> ATR</span>}
        {indicators.has('ADX')    && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.adx }}><Minus size={12} /> ADX</span>}
        {indicators.has('Volume') && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.up    }}><BarChart2 size={11} /> Volume</span>}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>
          Powered by Brifix Charts · Data is simulated
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
