'use client';

// Top-level import — safe because this file is 'use client' only
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  type IChartApi,
  type Time,
} from 'lightweight-charts';

import { useEffect, useRef } from 'react';

/* ── helpers ─────────────────────────────── */
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
}

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

export function generateCandles(base: number, volBase: number, days: number, seed: number): Candle[] {
  const rand = makePrng(seed);
  const out: Candle[] = [];
  let price = base * (0.65 + rand() * 0.1);
  const now = Math.floor(Date.now() / 1000);
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 86400;
    if (new Date(ts * 1000).getDay() % 6 === 0) continue;
    const trend = Math.sin(i / 60) * 0.0008 + 0.0002;
    const chg = (rand() - 0.48 + trend) * volBase * 0.8;
    const open = price;
    const close = Math.max(open * 0.85, open + chg);
    const swing = Math.abs(chg) * (0.5 + rand() * 1.2);
    out.push({
      time: ts,
      open: +open.toFixed(2),
      high: +(Math.max(open, close) + swing * (0.3 + rand() * 0.7)).toFixed(2),
      low:  +(Math.min(open, close) - swing * (0.3 + rand() * 0.7)).toFixed(2),
      close: +close.toFixed(2),
      volume: Math.round(volBase * 1e5 * (0.5 + rand() * 1.5)),
    });
    price = close;
  }
  return out;
}

function sma(data: Candle[], p: number) {
  return data.slice(p - 1).map((_, i) => ({
    time: data[i + p - 1].time,
    value: +(data.slice(i, i + p).reduce((a, b) => a + b.close, 0) / p).toFixed(2),
  }));
}
function ema(data: Candle[], p: number) {
  const k = 2 / (p + 1); let e = data[0].close;
  return data.map((d, i) => { if (i > 0) e = d.close * k + e * (1 - k); return { time: d.time, value: +e.toFixed(2) }; });
}
function rsi(data: Candle[], p = 14) {
  return data.slice(p).map((_, i) => {
    let g = 0, l = 0;
    for (let j = i + 1; j <= i + p; j++) { const d = data[j].close - data[j - 1].close; d > 0 ? g += d : l -= d; }
    const rs = l === 0 ? 100 : g / l;
    return { time: data[i + p].time, value: +(100 - 100 / (1 + rs)).toFixed(2) };
  });
}
function bb(data: Candle[], p = 20, m = 2) {
  return data.slice(p - 1).map((_, i) => {
    const sl = data.slice(i, i + p).map(d => d.close);
    const mean = sl.reduce((a, b) => a + b, 0) / p;
    const std = Math.sqrt(sl.reduce((a, b) => a + (b - mean) ** 2, 0) / p);
    return { time: data[i + p - 1].time, upper: +(mean + m * std).toFixed(2), lower: +(mean - m * std).toFixed(2) };
  });
}

const T = (t: number) => t as unknown as Time;

const BG = '#0F1520';
const GRID = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT = '#8892B0';

/* ── Props ───────────────────────────────── */
export interface BrifixChartProps {
  candles: Candle[];
  width: number;
  height: number;
  showRSI?: boolean;
  showVolume?: boolean;
  showMA20?: boolean;
  showMA50?: boolean;
  showEMA20?: boolean;
  showBB?: boolean;
  mini?: boolean; // compact mode for dashboard
}

export default function BrifixChart({
  candles, width, height,
  showRSI = true, showVolume = true,
  showMA20 = true, showMA50 = true,
  showEMA20 = false, showBB = false,
  mini = false,
}: BrifixChartProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef  = useRef<HTMLDivElement>(null);
  const mainChart = useRef<IChartApi | null>(null);
  const rsiChart  = useRef<IChartApi | null>(null);

  const RSI_LABEL = showRSI && !mini ? 20 : 0;
  const mainH = showRSI && !mini ? Math.floor(height * 0.68) : height;
  const rsiH  = showRSI && !mini ? height - mainH - RSI_LABEL : 0;

  useEffect(() => {
    if (!mainRef.current || candles.length < 2) return;

    // Destroy old
    mainChart.current?.remove();
    rsiChart.current?.remove();
    mainChart.current = null;
    rsiChart.current = null;

    // ── Main chart ──────────────────────────────────────────────
    const chart = createChart(mainRef.current, {
      width, height: mainH,
      layout: { background: { color: BG }, textColor: TEXT, fontSize: mini ? 10 : 11 },
      grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: BORDER,
        scaleMargins: { top: 0.08, bottom: showVolume ? 0.22 : 0.05 },
      },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    });
    mainChart.current = chart;

    // Candlestick
    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', downColor: '#F43F5E',
      borderUpColor: '#10B981', borderDownColor: '#F43F5E',
      wickUpColor: '#10B981', wickDownColor: '#F43F5E',
    });
    cs.setData(candles.map(c => ({ time: T(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));

    // Volume
    if (showVolume) {
      const vs = chart.addSeries(HistogramSeries, { color: 'rgba(99,102,241,0.4)', priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vs.setData(candles.map(c => ({ time: T(c.time), value: c.volume, color: c.close >= c.open ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)' })));
    }

    // MA20
    if (showMA20) {
      const s = chart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(sma(candles, 20).map(d => ({ time: T(d.time), value: d.value })));
    }
    // MA50
    if (showMA50) {
      const s = chart.addSeries(LineSeries, { color: '#818CF8', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(sma(candles, 50).map(d => ({ time: T(d.time), value: d.value })));
    }
    // EMA20
    if (showEMA20) {
      const s = chart.addSeries(LineSeries, { color: '#06B6D4', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(ema(candles, 20).map(d => ({ time: T(d.time), value: d.value })));
    }
    // BB
    if (showBB) {
      const bands = bb(candles);
      const bu = chart.addSeries(LineSeries, { color: 'rgba(99,102,241,0.55)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      const bl = chart.addSeries(LineSeries, { color: 'rgba(99,102,241,0.55)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      bu.setData(bands.map(d => ({ time: T(d.time), value: d.upper })));
      bl.setData(bands.map(d => ({ time: T(d.time), value: d.lower })));
    }

    chart.timeScale().fitContent();

    // ── RSI sub-chart ───────────────────────────────────────────
    if (showRSI && !mini && rsiRef.current && rsiH > 0) {
      const rc = createChart(rsiRef.current, {
        width, height: rsiH,
        layout: { background: { color: BG }, textColor: TEXT, fontSize: 10 },
        grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: BORDER, scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: BORDER, timeVisible: false, visible: false },
        handleScroll: true, handleScale: true,
      });
      rsiChart.current = rc;

      const rs = rc.addSeries(LineSeries, { color: '#A78BFA', lineWidth: 2, priceLineVisible: false, lastValueVisible: true });
      rs.setData(rsi(candles).map(d => ({ time: T(d.time), value: d.value })));
      rs.createPriceLine({ price: 70, color: 'rgba(244,63,94,0.55)',   lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OB' });
      rs.createPriceLine({ price: 30, color: 'rgba(16,185,129,0.55)',  lineWidth: 1, lineStyle: 2, axisLabelVisible: true,  title: 'OS' });
      rs.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.12)', lineWidth: 1, lineStyle: 1, axisLabelVisible: false, title: '' });
      rc.timeScale().fitContent();

      chart.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) rc.timeScale().setVisibleLogicalRange(r); });
      rc.timeScale().subscribeVisibleLogicalRangeChange(r => { if (r) chart.timeScale().setVisibleLogicalRange(r); });
    }

    return () => {
      mainChart.current?.remove();
      rsiChart.current?.remove();
      mainChart.current = null;
      rsiChart.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, width, height, showRSI, showVolume, showMA20, showMA50, showEMA20, showBB]);

  // Resize
  useEffect(() => {
    if (!mainChart.current) return;
    mainChart.current.applyOptions({ width, height: mainH });
    if (rsiChart.current) rsiChart.current.applyOptions({ width, height: rsiH });
  }, [width, height, mainH, rsiH]);

  return (
    <div style={{ width, height, background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div ref={mainRef} style={{ width, height: mainH, flexShrink: 0 }} />
      {showRSI && !mini && rsiH > 0 && (
        <>
          <div style={{ height: RSI_LABEL, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: '#A78BFA', background: BG, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            RSI (14)
          </div>
          <div ref={rsiRef} style={{ width, height: rsiH, flexShrink: 0 }} />
        </>
      )}
    </div>
  );
}
