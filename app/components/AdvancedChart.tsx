'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function AdvancedChart() {
  return <div>Advanced Chart Component</div>;
}

/* ─── Indicator Calculations ─────────────── */
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
