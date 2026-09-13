'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  autosize?: boolean;
  interval?: string;
  allow_symbol_change?: boolean;
  hide_side_toolbar?: boolean;
  details?: boolean;
  calendar?: boolean;
  studies?: string[];
}

function TradingViewChartInner({
  symbol = 'NSE:NIFTY',
  theme = 'dark',
  height = 600,
  autosize = true,
  interval = 'D',
  allow_symbol_change = true,
  hide_side_toolbar = false,
  details = true,
  calendar = false,
  studies = ['STD;RSI', 'STD;MACD'],
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: autosize,
      symbol: symbol,
      interval: interval,
      timezone: 'Asia/Kolkata',
      theme: theme,
      style: '1',
      locale: 'en',
      allow_symbol_change: allow_symbol_change,
      hide_side_toolbar: hide_side_toolbar,
      details: details,
      calendar: calendar,
      studies: studies,
      support_host: 'https://www.tradingview.com',
      backgroundColor: 'rgba(10, 14, 23, 1)',
      gridColor: 'rgba(30, 41, 59, 0.3)',
      toolbar_bg: '#111827',
      enable_publishing: false,
      withdateranges: true,
      hide_top_toolbar: false,
      save_image: true,
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, autosize, allow_symbol_change, hide_side_toolbar, details, calendar, studies]);

  return (
    <div
      className="tradingview-widget-container rounded-xl overflow-hidden border border-[var(--surface-border)]"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div
        ref={containerRef}
        className="tradingview-widget-container__widget"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartInner);
export default TradingViewChart;
