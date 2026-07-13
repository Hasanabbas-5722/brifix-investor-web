'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import { Activity, RefreshCw } from 'lucide-react';
import { fetchChartData, type ChartCandle } from '@/lib/services/chartService';

type IndicatorKey =
  | 'MA20'
  | 'MA50'
  | 'EMA20'
  | 'BB'
  | 'RSI'
  | 'Volume'
  | 'MACD'
  | 'Stochastic'
  | 'ATR'
  | 'ADX';

type TimeframeKey = '1D' | '1W' | '1M' | '3M' | '1Y';

const TIMEFRAMES: Record<TimeframeKey, { interval: string; period: string }> = {
  '1D': { interval: '5m', period: '5d' },
  '1W': { interval: '30m', period: '1mo' },
  '1M': { interval: '1h', period: '3mo' },
  '3M': { interval: '1d', period: '1y' },
  '1Y': { interval: '1d', period: '2y' },
};

const T = (t: number) => Math.floor(t / 1000) as unknown as Time;

const C = {
  bg: '#0F1520',
  grid: 'rgba(255,255,255,0.04)',
  text: '#8892B0',
  border: 'rgba(255,255,255,0.07)',
  up: '#10B981',
  down: '#F43F5E',
  ma20: '#F59E0B',
  ma50: '#818CF8',
  ema20: '#06B6D4',
  bbLine: 'rgba(99,102,241,0.55)',
  rsi: '#A78BFA',
  volUp: 'rgba(16,185,129,0.35)',
  volDown: 'rgba(244,63,94,0.35)',
  macd: '#3B82F6',
  macdSignal: '#F59E0B',
  stochK: '#8B5CF6',
  stochD: '#EC4899',
  atr: '#14B8A6',
  adx: '#F97316',
} as const;

function sma(data: ChartCandle[], period: number) {
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j].close;
    out.push({ time: data[i].time, value: +(sum / period).toFixed(2) });
  }
  return out;
}

function ema(data: { time: number; value: number }[], period: number) {
  const k = 2 / (period + 1);
  const out: { time: number; value: number }[] = [];
  let prev = data[0]?.value ?? 0;
  data.forEach((d, i) => {
    if (i > 0) prev = d.value * k + prev * (1 - k);
    out.push({ time: d.time, value: +prev.toFixed(2) });
  });
  return out;
}

function rsi(data: ChartCandle[], period = 14) {
  const out: { time: number; value: number }[] = [];
  for (let i = period; i < data.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j].close - data[j - 1].close;
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    out.push({ time: data[i].time, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  }
  return out;
}

function bb(data: ChartCandle[], period = 20, mult = 2) {
  const upper: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1).map((d) => d.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    upper.push({ time: data[i].time, value: +(mean + mult * std).toFixed(2) });
    lower.push({ time: data[i].time, value: +(mean - mult * std).toFixed(2) });
  }
  return { upper, lower };
}

function macdLine(data: ChartCandle[]) {
  const close = data.map((d) => ({ time: d.time, value: d.close }));
  const fast = ema(close, 12);
  const slow = ema(close, 26);
  const out: { time: number; value: number }[] = [];
  for (let i = 0; i < Math.min(fast.length, slow.length); i++) {
    out.push({ time: fast[i].time, value: +(fast[i].value - slow[i].value).toFixed(2) });
  }
  return out;
}

function stochasticK(data: ChartCandle[], period = 14) {
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map((d) => d.high));
    const lowest = Math.min(...slice.map((d) => d.low));
    const k = lowest === highest ? 50 : ((data[i].close - lowest) / (highest - lowest)) * 100;
    out.push({ time: data[i].time, value: +k.toFixed(2) });
  }
  return out;
}

function atr(data: ChartCandle[], period = 14) {
  const tr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < tr.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += tr[j];
    out.push({ time: data[i + 1].time, value: +(sum / period).toFixed(2) });
  }
  return out;
}

function adx(data: ChartCandle[], period = 14) {
  const dx: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;
    const plusDM = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
    const minusDM = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    const plusDI = tr === 0 ? 0 : (plusDM / tr) * 100;
    const minusDI = tr === 0 ? 0 : (minusDM / tr) * 100;
    const value = plusDI + minusDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dx.push(value);
  }
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < dx.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += dx[j];
    out.push({ time: data[i + 1].time, value: +(sum / period).toFixed(2) });
  }
  return out;
}

export default function TradingViewWidget({
  symbol,
}: {
  symbol: string;
}) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1M');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [candles, setCandles] = useState<ChartCandle[]>([]);
  const [indicators, setIndicators] = useState<Set<IndicatorKey>>(
    new Set(['MA20', 'MA50', 'Volume', 'RSI'])
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const subRef = useRef<IChartApi | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const tf = TIMEFRAMES[timeframe];
      const response = await fetchChartData({
        symbol,
        interval: tf.interval,
        period: tf.period,
      });
      if (!response.success || !response.data?.candles?.length) {
        throw new Error(response.error || 'No chart data available');
      }
      setCandles(response.data.candles);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, timeframe]);

  const indicatorList = useMemo(
    () =>
      [
        { k: 'MA20', label: 'MA20', color: C.ma20 },
        { k: 'MA50', label: 'MA50', color: C.ma50 },
        { k: 'EMA20', label: 'EMA20', color: C.ema20 },
        { k: 'BB', label: 'BB', color: '#6366F1' },
        { k: 'RSI', label: 'RSI', color: C.rsi },
        { k: 'MACD', label: 'MACD', color: C.macd },
        { k: 'Stochastic', label: 'Stoch', color: C.stochK },
        { k: 'ATR', label: 'ATR', color: C.atr },
        { k: 'ADX', label: 'ADX', color: C.adx },
        { k: 'Volume', label: 'VOL', color: C.up },
      ] as { k: IndicatorKey; label: string; color: string }[],
    []
  );

  useEffect(() => {
    if (!mainRef.current || !rootRef.current || candles.length < 2) return;

    chartRef.current?.remove();
    subRef.current?.remove();

    const showSub = indicators.has('RSI');
    const width = rootRef.current.clientWidth;
    const height = rootRef.current.clientHeight - 58;
    const mainH = showSub ? Math.floor(height * 0.72) : height;
    const subH = showSub ? Math.max(80, height - mainH - 20) : 0;

    if (panelRef.current) {
      panelRef.current.style.height = `${subH}px`;
    }

    const chart = createChart(mainRef.current, {
      width,
      height: mainH,
      layout: { background: { color: C.bg }, textColor: C.text, fontSize: 11 },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: C.border,
        scaleMargins: { top: 0.08, bottom: indicators.has('Volume') ? 0.22 : 0.05 },
      },
      timeScale: { borderColor: C.border, timeVisible: true },
    });
    chartRef.current = chart;

    const cs = chart.addSeries(CandlestickSeries, {
      upColor: C.up,
      downColor: C.down,
      borderUpColor: C.up,
      borderDownColor: C.down,
      wickUpColor: C.up,
      wickDownColor: C.down,
    });
    cs.setData(candles.map((c) => ({ time: T(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));

    if (indicators.has('Volume')) {
      const vs = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vs.setData(
        candles.map((c) => ({
          time: T(c.time),
          value: c.volume,
          color: c.close >= c.open ? C.volUp : C.volDown,
        }))
      );
    }

    if (indicators.has('MA20')) {
      const s = chart.addSeries(LineSeries, { color: C.ma20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(sma(candles, 20).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('MA50')) {
      const s = chart.addSeries(LineSeries, { color: C.ma50, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(sma(candles, 50).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('EMA20')) {
      const close = candles.map((c) => ({ time: c.time, value: c.close }));
      const s = chart.addSeries(LineSeries, { color: C.ema20, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(ema(close, 20).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('BB')) {
      const bands = bb(candles);
      const bu = chart.addSeries(LineSeries, {
        color: C.bbLine,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        lineStyle: 2,
      });
      const bl = chart.addSeries(LineSeries, {
        color: C.bbLine,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        lineStyle: 2,
      });
      bu.setData(bands.upper.map((d) => ({ time: T(d.time), value: d.value })));
      bl.setData(bands.lower.map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('MACD')) {
      const s = chart.addSeries(LineSeries, { color: C.macd, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(macdLine(candles).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('Stochastic')) {
      const s = chart.addSeries(LineSeries, { color: C.stochK, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(stochasticK(candles).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('ATR')) {
      const s = chart.addSeries(LineSeries, { color: C.atr, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(atr(candles).map((d) => ({ time: T(d.time), value: d.value })));
    }
    if (indicators.has('ADX')) {
      const s = chart.addSeries(LineSeries, { color: C.adx, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(adx(candles).map((d) => ({ time: T(d.time), value: d.value })));
    }
    chart.timeScale().fitContent();

    if (showSub && panelRef.current) {
      const sub = createChart(panelRef.current, {
        width,
        height: subH,
        layout: { background: { color: C.bg }, textColor: C.text, fontSize: 10 },
        grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
        timeScale: { borderColor: C.border, visible: false },
      });
      subRef.current = sub;

      const rs = sub.addSeries(LineSeries, { color: C.rsi, lineWidth: 2, priceLineVisible: false });
      rs.setData(rsi(candles).map((d) => ({ time: T(d.time), value: d.value })));
      rs.createPriceLine({ price: 70, color: 'rgba(244,63,94,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' });
      rs.createPriceLine({ price: 30, color: 'rgba(16,185,129,0.55)', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' });
      rs.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.12)', lineWidth: 1, lineStyle: 1, axisLabelVisible: false, title: '' });
      sub.timeScale().fitContent();
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) sub.timeScale().setVisibleLogicalRange(range);
      });
    }

    const ro = new ResizeObserver(() => {
      if (!rootRef.current || !chartRef.current) return;
      const newW = rootRef.current.clientWidth;
      const newH = rootRef.current.clientHeight - 58;
      const updatedMainH = showSub ? Math.floor(newH * 0.72) : newH;
      const updatedSubH = showSub ? Math.max(80, newH - updatedMainH - 20) : 0;
      chartRef.current.applyOptions({ width: newW, height: updatedMainH });
      if (showSub && subRef.current) {
        subRef.current.applyOptions({ width: newW, height: updatedSubH });
      }
    });
    ro.observe(rootRef.current);

    return () => {
      ro.disconnect();
      chartRef.current?.remove();
      subRef.current?.remove();
      chartRef.current = null;
      subRef.current = null;
    };
  }, [candles, indicators]);

  return (
    <div ref={rootRef} style={{ width: '100%', height: '100%', background: C.bg }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          height: 34,
          padding: '0 10px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {(['1D', '1W', '1M', '3M', '1Y'] as TimeframeKey[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              height: 24,
              padding: '0 8px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              background: timeframe === tf ? 'var(--accent)' : 'transparent',
              color: timeframe === tf ? '#fff' : 'var(--text-3)',
            }}
          >
            {tf}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: C.border }} />
        <Activity size={12} color="var(--text-3)" />
        {indicatorList.map((ind) => (
          <button
            key={ind.k}
            onClick={() =>
              setIndicators((prev) => {
                const next = new Set(prev);
                if (next.has(ind.k)) next.delete(ind.k);
                else next.add(ind.k);
                return next;
              })
            }
            style={{
              height: 22,
              borderRadius: 12,
              border: 'none',
              padding: '0 8px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              background: indicators.has(ind.k) ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: indicators.has(ind.k) ? ind.color : 'var(--text-3)',
            }}
          >
            {ind.label}
          </button>
        ))}
        <button
          onClick={fetchData}
          style={{
            marginLeft: 'auto',
            width: 24,
            height: 24,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--text-3)',
          }}
          title="Refresh chart"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {isLoading && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-3)' }}>Loading chart...</div>}
      {error && <div style={{ padding: 12, fontSize: 12, color: 'var(--red)' }}>{error}</div>}

      <div ref={mainRef} style={{ width: '100%', height: indicators.has('RSI') ? '68%' : '88%' }} />
      {indicators.has('RSI') && (
        <>
          <div style={{ height: 20, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: C.rsi, borderTop: `1px solid ${C.border}` }}>
            RSI (14)
          </div>
          <div ref={panelRef} style={{ width: '100%' }} />
        </>
      )}
    </div>
  );
}
