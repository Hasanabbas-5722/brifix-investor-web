'use client';

import { useEffect, useRef, memo } from 'react';

interface MiniChartProps {
  symbol?: string;
  width?: string | number;
  height?: number;
}

function TradingViewMiniChartInner({
  symbol = 'NSE:NIFTY',
  width = '100%',
  height = 220,
}: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: '100%',
      height: height,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      largeChartUrl: '',
      noTimeScale: false,
      chartOnly: false,
    });

    containerRef.current.appendChild(script);
  }, [symbol, height]);

  return (
    <div
      className="tradingview-widget-container"
      style={{ width, height }}
    >
      <div ref={containerRef} className="tradingview-widget-container__widget" />
    </div>
  );
}

export const TradingViewMiniChart = memo(TradingViewMiniChartInner);
export default TradingViewMiniChart;
