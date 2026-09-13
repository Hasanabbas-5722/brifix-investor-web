'use client';

import { useEffect, useRef, memo } from 'react';

function TradingViewHeatmapInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: ['NSE'],
      dataSource: 'SENSEX',
      grouping: 'sector',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '500',
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container rounded-xl overflow-hidden border border-[var(--surface-border)]" style={{ height: '500px' }}>
      <div ref={containerRef} className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

export const TradingViewHeatmap = memo(TradingViewHeatmapInner);
export default TradingViewHeatmap;
