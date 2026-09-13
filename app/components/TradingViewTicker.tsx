'use client';

import { useEffect, useRef, memo } from 'react';

function TradingViewTickerInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'NSE:NIFTY', title: 'NIFTY 50' },
        { proName: 'NSE:BANKNIFTY', title: 'BANK NIFTY' },
        { proName: 'BSE:SENSEX', title: 'SENSEX' },
        { proName: 'NSE:RELIANCE', title: 'RELIANCE' },
        { proName: 'NSE:TCS', title: 'TCS' },
        { proName: 'NSE:HDFCBANK', title: 'HDFC BANK' },
        { proName: 'NSE:INFY', title: 'INFOSYS' },
        { proName: 'NSE:ICICIBANK', title: 'ICICI BANK' },
        { proName: 'NSE:SBIN', title: 'SBI' },
        { proName: 'NSE:ITC', title: 'ITC' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en',
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container overflow-hidden">
      <div ref={containerRef} className="tradingview-widget-container__widget" />
    </div>
  );
}

export const TradingViewTicker = memo(TradingViewTickerInner);
export default TradingViewTicker;
