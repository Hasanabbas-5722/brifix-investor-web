'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TradingViewWidget from './components/TradingViewWidget';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ChevronRight, Flame, Zap, Star, BarChart3, Newspaper, Clock,
  Sparkles, Target, Shield, ArrowRight,
} from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { useSocket } from '@/lib/services/useSocket';
import SocketService from '@/lib/services/socketService';
import { useDispatch, useSelector } from 'react-redux';
import { updateNifty50, updateBankNifty, updateFinNifty } from '@/lib/store/slices/indexSlice';
import { fetchChartData } from '@/lib/services/chartService';

const gainers = [
  { sym: 'ADANIENT', name: 'Adani Enterprises', price: '₹3,245.80', chg: '+8.42%' },
  { sym: 'TATAMOTORS', name: 'Tata Motors', price: '₹985.25', chg: '+5.18%' },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel', price: '₹1,642.30', chg: '+4.25%' },
  { sym: 'RELIANCE', name: 'Reliance Ind.', price: '₹2,912.15', chg: '+3.87%' },
  { sym: 'SBIN', name: 'SBI', price: '₹812.40', chg: '+3.21%' },
];

const losers = [
  { sym: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,582.10', chg: '-2.94%' },
  { sym: 'WIPRO', name: 'Wipro', price: '₹485.30', chg: '-2.18%' },
  { sym: 'INFY', name: 'Infosys', price: '₹1,423.85', chg: '-1.85%' },
  { sym: 'SUNPHARMA', name: 'Sun Pharma', price: '₹1,156.70', chg: '-1.42%' },
  { sym: 'NESTLEIND', name: 'Nestle India', price: '₹2,345.20', chg: '-1.12%' },
];

const news = [
  { id: 1, title: 'RBI holds repo rate steady at 6.5% amid global uncertainty', cat: 'Economy', time: '2h ago' },
  { id: 2, title: 'Reliance Jio announces 5G expansion plans across Tier-2 cities', cat: 'Stocks', time: '3h ago' },
  { id: 3, title: 'New IPO pipeline: 5 companies to list next week on NSE', cat: 'IPO', time: '4h ago' },
  { id: 4, title: 'IT sector: TCS and Infosys report strong Q4 guidance', cat: 'Results', time: '5h ago' },
  { id: 5, title: 'Auto sector rallies as Tata Motors reports record EV deliveries', cat: 'Stocks', time: '6h ago' },
];

const quickActions = [
  { label: 'Charts', Icon: BarChart3, href: '/chart', from: '#6366F1', to: '#818CF8' },
  { label: 'AI Predict', Icon: Zap, href: '/predictions', from: '#7C3AED', to: '#A78BFA' },
  { label: 'Watchlist', Icon: Star, href: '/watchlist', from: '#D97706', to: '#F59E0B' },
  { label: 'Heatmap', Icon: Flame, href: '/chart', from: '#DC2626', to: '#F43F5E' },
];

const INDEX_CHART_SYMBOLS: Record<string, string> = {
  'NIFTY 50': '^NSEI',
  'BANK NIFTY': '^NSEBANK',
  'FIN NIFTY': 'NIFTY_FIN_SERVICE.NS',
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const indicesData = useSelector((state: any) => state.indexData);
  const token = useSelector((state: any) => state.auth.token);

  const [marketStatus, setMarketStatus] = useState("Closed");
  const [marketInfo, setMarketInfo] = useState<{
    isOpen: boolean;
    status: string;
    statusDetail: string;
    openTime: string;
    closeTime: string;
  }>({
    isOpen: false,
    status: "Closed",
    statusDetail: "Market closed · Opens at 09:15 AM IST",
    openTime: "09:15 AM IST",
    closeTime: "03:30 PM IST",
  });
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [topGainers, setTopGainers] = useState(gainers);
  const [topLosers, setTopLosers] = useState(losers);
  const [latestNews, setLatestNews] = useState(news);
  const [dailyPicks, setDailyPicks] = useState<any[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState('0');
  const [selectedIndex, setSelectedIndex] = useState('NIFTY 50');

  const { socket, isConnected, subscribeToIndexes } = useSocket();

  useEffect(() => {
    fetchMarketStatus();
    fetchTopMoves();
    fetchInitialIndexData();
    fetchDailyRecommendations();
  }, []);

  const fetchInitialIndexData = async () => {
    try {
      const symbols = [
        { name: 'NIFTY 50', symbol: '^NSEI', updateAction: updateNifty50 },
        { name: 'BANK NIFTY', symbol: '^NSEBANK', updateAction: updateBankNifty },
        { name: 'FIN NIFTY', symbol: 'NIFTY_FIN_SERVICE.NS', updateAction: updateFinNifty },
      ];

      await Promise.all(
        symbols.map(async ({ symbol, updateAction }) => {
          try {
            const res = await fetchChartData({
              symbol,
              interval: '1d',
              period: '5d',
            });

            if (res.success && res.data) {
              const currentPrice = res.data.currentPrice;
              const previousClose = res.data.previousClose;
              const change = currentPrice - previousClose;
              const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
              const sign = change >= 0 ? '+' : '-';

              dispatch(updateAction({
                value: currentPrice.toFixed(2),
                difference: Math.abs(change).toFixed(2),
                percentage: Math.abs(changePercent).toFixed(2),
                sign: sign,
              }));
            }
          } catch (err) {
            console.error(`Error fetching initial data for ${symbol}:`, err);
          }
        })
      );
    } catch (error) {
      console.error('Error in fetchInitialIndexData:', error);
    }
  };

  const fetchMarketStatus = async () => {
    try {
      const res = await authService.marketStatus();
      const data = res?.data;
      if (data) {
        const rawStatus = data.status || data.market_status?.[0]?.marketStatus || 'Closed';
        const isOpen = Boolean(data.is_open || rawStatus.toLowerCase() === 'open');
        const status = isOpen ? 'Open' : 'Closed';
        const statusDetail = data.status_detail || (isOpen ? 'Trading is live · Closes at 03:30 PM IST' : (data.schedule?.next_session_label || 'Market closed · Opens at 09:15 AM IST'));

        setMarketStatus(status);
        setMarketInfo({
          isOpen,
          status,
          statusDetail,
          openTime: data.schedule?.open_time || '09:15 AM IST',
          closeTime: data.schedule?.close_time || '03:30 PM IST',
        });
      }
    } catch (error) {
      console.error('Error fetching market status:', error);
      // Fallback to local IST calculation
      try {
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const day = nowIST.getDay();
        const mins = nowIST.getHours() * 60 + nowIST.getMinutes();
        const isOpen = day >= 1 && day <= 5 && mins >= 555 && mins < 930;
        setMarketStatus(isOpen ? 'Open' : 'Closed');
        setMarketInfo({
          isOpen,
          status: isOpen ? 'Open' : 'Closed',
          statusDetail: isOpen ? 'Trading session is active (09:15 - 15:30 IST)' : 'Market closed · Opens at 09:15 AM IST',
          openTime: '09:15 AM IST',
          closeTime: '03:30 PM IST',
        });
      } catch {}
    }
  };

  const formatPct = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '0.00%';
    const sign = n >= 0 ? '+' : '-';
    return `${sign}${Math.abs(n).toFixed(2)}%`;
  };

  const formatPriceINR = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return '₹0';
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const fetchTopMoves = async () => {
    console.log("fetchTopMoves api called :::::::::::::::::::::::::::")
    setIsLoading(true);
    try {
      // Prefer the combined dashboard endpoint from the Flask backend
      console.log("authService.getDashboard()")
      const dashRes = await authService.getDashboard();
      // console.log("dashRes", dashRes)
      const payload = dashRes?.data?.data ?? dashRes?.data;

      const niftyGainers = payload?.nifty_gainers ?? [];
      const niftyLosers = payload?.nifty_losers ?? [];

      console.log("niftyGainers", niftyGainers)
      console.log("niftyLosers", niftyLosers)

      if (Array.isArray(niftyGainers) && niftyGainers.length) {
        setTopGainers(
          niftyGainers.slice(0, 5).map((item: any) => ({
            sym: item?.symbol ?? item?.stockSymbol ?? '—',
            name:
              item?.stockinfo?.shortName ??
              item?.stockinfo?.longName ??
              item?.companyName ??
              item?.symbol ??
              '—',
            price: formatPriceINR(item?.ltp ?? item?.lastPrice ?? item?.price),
            chg: formatPct(item?.pChange ?? item?.changePercent ?? item?.pctChange),
          }))
        );
      }

      if (Array.isArray(niftyLosers) && niftyLosers.length) {
        setTopLosers(
          niftyLosers.slice(0, 5).map((item: any) => ({
            sym: item?.symbol ?? item?.stockSymbol ?? '—',
            name:
              item?.stockinfo?.shortName ??
              item?.stockinfo?.longName ??
              item?.companyName ??
              item?.symbol ??
              '—',
            price: formatPriceINR(item?.ltp ?? item?.lastPrice ?? item?.price),
            chg: formatPct(item?.pChange ?? item?.changePercent ?? item?.pctChange),
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching top moves:', error);
      // Keep initial mock lists as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyRecommendations = async () => {
    setLoadingPicks(true);
    try {
      const res = await authService.getDailyRecommendations();
      const picks = res?.data?.data ?? res?.data;
      if (Array.isArray(picks) && picks.length > 0) {
        setDailyPicks(picks);
      }
    } catch (err) {
      console.error('Error fetching daily recommendations:', err);
    } finally {
      setLoadingPicks(false);
    }
  };

  const indices = [
    { name: 'NIFTY 50', value: indicesData?.nifty50?.value, change: indicesData?.nifty50?.difference, pct: indicesData?.nifty50?.percentage, up: indicesData?.nifty50?.sign },
    { name: 'BANK NIFTY', value: indicesData?.banknifty?.value, change: indicesData?.banknifty?.difference, pct: indicesData?.banknifty?.percentage, up: indicesData?.banknifty?.sign },
    { name: 'FIN NIFTY', value: indicesData?.finnifty?.value, change: indicesData?.finnifty?.difference, pct: indicesData?.finnifty?.percentage, up: indicesData?.finnifty?.sign },
  ];



  useEffect(() => {
    // fetchInitialData();
  }, []);


  useEffect(() => {
    console.log("socket", socket)
    console.log("isConnected", isConnected)
    if (isConnected && socket) {
      // Subscribe to real-time updates
      subscribeToIndexes({
        tokens: ['Nifty 50', 'Nifty Bank', 'Nifty Fin Service'],
        accessToken: token,
      });

      socket.on('indexes_data', (data: any) => {
        // Map socket data to our indices format
        // console.log("data", data)
        const token = data?.token

        //     if (!token || !ltp) {
        //   return;
        // }
        if (token == "99926000") {
          // const change = parseFloat(nsei.change || 0).toFixed(2);
          // const changePercent = parseFloat(nsei.changePercent || 0).toFixed(2);
          const open = (data?.full_data?.open_price_of_the_day || 0) / 100;
          const ltp =
            (data?.full_data?.last_traded_price || 0) / 100;
          const price = ltp.toFixed(2);

          const close =
            (data?.full_data?.closed_price || 0) / 100;

          const change = ltp - close;

          const changePercent =
            close > 0
              ? (change / close) * 100
              : 0;

          const sign = change >= 0 ? '+' : '-';

          dispatch(updateNifty50({
            value: price,
            difference: `${Math.abs(change).toFixed(2)}`,
            percentage: `${Math.abs(changePercent).toFixed(2)}`,
            sign: sign
          }));
        }
        if (token == "99926009") {
          const bank = data;
          const ltpBank =
            (data?.full_data?.last_traded_price || 0) / 100;
          const price = ltpBank.toFixed(2);

          const close = (data?.full_data?.closed_price || 0) / 100;

          const change = ltpBank - close;

          const changePercent =
            close > 0
              ? (change / close) * 100
              : 0;
          const sign = change >= 0 ? '+' : '-';

          dispatch(updateBankNifty({
            value: price,
            difference: `${Math.abs(change).toFixed(2)}`,
            percentage: `${Math.abs(changePercent).toFixed(2)}`,
            sign: sign
          }));
        }
        if (token == "99926037") {
          const ltpfin =
            (data?.full_data?.last_traded_price || 0) / 100;
          const price = ltpfin.toFixed(2);

          const close = (data?.full_data?.closed_price || 0) / 100;

          const change = ltpfin - close;
          const changePercent =
            close > 0
              ? (change / close) * 100
              : 0;
          const sign = change >= 0 ? '+' : '-';

          dispatch(updateFinNifty({
            value: price,
            difference: `${Math.abs(change).toFixed(2)}`,
            percentage: `${Math.abs(changePercent).toFixed(2)}`,
            sign: sign
          }));
        }
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const name = (item.name || item.symbol || '').toUpperCase();
            const actionPayload = {
              value: String(item.value ?? item.price ?? '0'),
              difference: String(item.change ?? '0'),
              percentage: String(item.percentage ?? item.pChange ?? '0'),
              sign: item.sign || (Number(item.change) >= 0 ? '+' : '-'),
            };
            if (name.includes('BANK')) {
              dispatch(updateBankNifty(actionPayload));
            } else if (name.includes('FIN')) {
              dispatch(updateFinNifty(actionPayload));
            } else if (name.includes('NIFTY')) {
              dispatch(updateNifty50(actionPayload));
            }
          });
        }
      });

      socket.on('gainers_data', (data: any) => {
        if (Array.isArray(data)) {
          const mapped = data.slice(0, 5).map((item: any) => ({
            sym: item.symbol,
            name: item.companyName || item.symbol,
            price: `₹${item.ltp?.toLocaleString('en-IN') || '0'}`,
            chg: `+${item.pChange?.toFixed(2) || '0'}%`
          }));
          setTopGainers(mapped);
        }
      });

      return () => {
        socket.off('indexes_data');
        socket.off('gainers_data');
      };
    }
  }, [socket, isConnected, subscribeToIndexes, token]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [newsRes, gainerRes, loserRes, dashRes] = await Promise.all([
        authService.getNews(),
        authService.getTopGainers(),
        authService.getNiftyLoser(),
        authService.getDashboard()
      ]);

      if (newsRes.data) {
        setLatestNews(newsRes.data.map((item: any, i: number) => ({
          id: i,
          title: item.title,
          cat: item.category || 'Stocks',
          time: item.time || 'Just now'
        })));
      }

      if (gainerRes.data) {
        setTopGainers(gainerRes.data.map((item: any) => ({
          sym: item.symbol,
          name: item.symbol,
          price: `₹${item.ltp}`,
          chg: `+${item.pChange}%`
        })));
      }

      if (dashRes.data && dashRes.data.portfolio) {
        setPortfolioValue(dashRes.data.portfolio.totalValue?.toLocaleString('en-IN') || portfolioValue);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const list = tab === 'gainers' ? topGainers : topLosers;



  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Dynamic Market Status Header ─────────────────── */}
      <div className="fade-in" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        background: 'rgba(255,255,255,0.02)',
        padding: '20px 24px',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        marginBottom: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          left: '0',
          top: '0',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 0% 0%, var(--accent-dim) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 className="gradient-text" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good Morning';
                if (hour < 17) return 'Good Afternoon';
                return 'Good Evening';
              })()}, Investor
            </h1>
            <span style={{ fontSize: 24 }}>👋</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ opacity: 0.7 }} />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: marketInfo.isOpen ? 'var(--green-bg)' : 'var(--red-bg)',
              padding: '6px 14px',
              borderRadius: '99px',
              border: `1px solid ${marketInfo.isOpen ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: marketInfo.isOpen ? 'var(--green)' : 'var(--red)',
                boxShadow: `0 0 12px ${marketInfo.isOpen ? 'var(--green)' : 'var(--red)'}`,
                animation: marketInfo.isOpen ? 'pulse-dot 2s infinite' : 'none'
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: 800,
                color: marketInfo.isOpen ? 'var(--green)' : 'var(--red)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Market {marketInfo.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
              {marketInfo.statusDetail}
            </p>
          </div>
        </div>
      </div>

      {/* ── Portfolio hero card ──────────── */}
      {/* <div className="card fade-up" style={{
        padding: '28px 28px',
        background: 'linear-gradient(135deg, #0F1520 0%, #161E2E 50%, #1a1f35 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <p className="label" style={{ marginBottom: 12 }}>Total Portfolio Value</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <p className="nums" style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>
            ₹{portfolioValue.split('.')[0]}
            <span style={{ fontSize: 18, color: 'var(--text-3)', fontWeight: 600 }}>.{portfolioValue.split('.')[1] || '00'}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '4px 10px' }}>
            <ArrowUpRight size={14} /> +₹0.00
          </span>
          <span className="badge-green">+0.00% today</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Invested: ₹0.00</span>
        </div>
      </div> */}

        {/* ── Market indices ───────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Market Indices</h2>
            <Link href="/chart" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
            className="grid-4-lg">
            {indices && indices.map((idx, i) => {
              // console.log("idx", idx, i)
              return (
                <button
                  key={idx.name}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(idx.name);
                    const symbolMap: Record<string, string> = {
                      'NIFTY 50': 'NIFTY50',
                      'BANK NIFTY': 'BANKNIFTY',
                      'FIN NIFTY': 'FINNIFTY',
                    };
                    const symId = symbolMap[idx.name];
                    if (symId) {
                      router.push(`/chart?symbol=${symId}`);
                    }
                  }}
                  className={`card card-hover fade-up d${i + 1}`}
                  style={{
                    padding: '16px 18px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: 'transparent',
                    border:
                      selectedIndex === idx.name
                        ? '1px solid var(--accent-light)'
                        : '1px solid var(--border)',
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, letterSpacing: '0.04em' }}>
                    {idx.name}
                  </p>
                  <p className="nums" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, marginBottom: 8 }}>
                    {idx.value}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="nums" style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: idx.up == "+" ? 'var(--green)' : 'var(--red)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3
                    }}>
                      {idx.up == "+" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {idx.change}
                    </span>
                    <span className={idx.up == "+" ? 'badge-green' : 'badge-red'}>
  
                      {idx.pct}%
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>


      {/* ── Quick actions ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}
        className="grid-2-sm">
        {quickActions.map(({ label, Icon, href, from, to }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover fade-up" style={{
              padding: '20px 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${from}, ${to})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${from}55`,
              }}>
                <Icon size={20} color="#fff" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>


      {/* ── Today's AI Stock Recommendations ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Sparkles size={18} color="#a855f7" /> Today's AI Stock Recommendations
              </h2>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                color: '#c084fc', padding: '3px 8px', borderRadius: 99,
                border: '1px solid rgba(168,85,247,0.3)',
              }}>
                BUY SIGNALS
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, marginBottom: 0 }}>
              Algorithmic high-probability trade setups scored for today's market session
            </p>
          </div>
          <Link href="/predictions" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
            Deep Prediction AI <ChevronRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {loadingPicks ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 20, minHeight: 180, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: '50%', height: 16, background: 'var(--bg-elevated)', borderRadius: 6 }} />
                <div style={{ width: '80%', height: 28, background: 'var(--bg-elevated)', borderRadius: 6 }} />
                <div style={{ width: '100%', height: 40, background: 'var(--bg-elevated)', borderRadius: 6, marginTop: 'auto' }} />
              </div>
            ))
          ) : dailyPicks.length > 0 ? (
            dailyPicks.slice(0, 4).map((pick: any) => (
              <div
                key={pick.symbol}
                className="card card-hover fade-up"
                style={{
                  padding: '20px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  border: '1px solid rgba(168,85,247,0.25)',
                  background: 'linear-gradient(180deg, rgba(168,85,247,0.04) 0%, var(--bg-card) 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header with signal and confidence */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: pick.signal === 'STRONG BUY' ? 'var(--green)' : '#38bdf8',
                      background: pick.signal === 'STRONG BUY' ? 'var(--green-bg)' : 'rgba(56,189,248,0.15)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      letterSpacing: '0.04em'
                    }}>
                      {pick.signal}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>
                      {pick.sector}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
                    <Target size={13} /> {pick.confidence}% AI Conf
                  </div>
                </div>

                {/* Stock symbol and price */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                      {pick.symbol}
                    </h3>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, marginBottom: 0 }}>
                      {pick.name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="nums" style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-1)', margin: 0 }}>
                      ₹{pick.current_price?.toLocaleString('en-IN')}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>CMP</span>
                  </div>
                </div>

                {/* Target & Stop Loss banner */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  background: 'var(--bg-elevated)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 11
                }}>
                  <div>
                    <span style={{ color: 'var(--text-3)', display: 'block' }}>1D Target</span>
                    <span className="nums" style={{ fontWeight: 700, color: 'var(--green)' }}>
                      ₹{pick.target_1d?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-3)', display: 'block' }}>5D Target</span>
                    <span className="nums" style={{ fontWeight: 700, color: 'var(--green)' }}>
                      ₹{pick.target_5d?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-3)', display: 'block' }}>Stop Loss</span>
                    <span className="nums" style={{ fontWeight: 700, color: 'var(--red)' }}>
                      ₹{pick.stop_loss?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* AI Rationale */}
                <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, margin: 0 }}>
                  💡 {pick.rationale}
                </p>

                {/* Action button */}
                <Link
                  href={`/predictions?symbol=${pick.symbol}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'var(--accent)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    marginTop: 'auto',
                    transition: 'all 0.15s'
                  }}
                >
                  Predict & Buy Setup <ArrowRight size={13} />
                </Link>
              </div>
            ))
          ) : null}
        </div>
      </div>


      {/* ── Gainers / Losers ─────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => setTab('gainers')}
            style={{
              height: 32, padding: '0 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: tab === 'gainers' ? 'var(--green-bg)' : 'transparent',
              color: tab === 'gainers' ? 'var(--green)' : 'var(--text-3)',
              outline: tab === 'gainers' ? '1px solid rgba(16,185,129,0.25)' : 'none',
            }}
          >
            <TrendingUp size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Top Gainers
          </button>
          <button
            onClick={() => setTab('losers')}
            style={{
              height: 32, padding: '0 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: tab === 'losers' ? 'var(--red-bg)' : 'transparent',
              color: tab === 'losers' ? 'var(--red)' : 'var(--text-3)',
              outline: tab === 'losers' ? '1px solid rgba(244,63,94,0.25)' : 'none',
            }}
          >
            <TrendingDown size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Top Losers
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 340 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Change</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={s.sym} className={`fade-up d${i + 1}`} style={{ cursor: 'pointer' }}>
                    <td>
                      <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{s.sym}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.name}</p>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="nums" style={{ fontWeight: 700 }}>{s.price}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={tab === 'gainers' ? 'badge-green' : 'badge-red'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {tab === 'gainers' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {s.chg}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Chart preview ────────────────── */}
      {/* <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{selectedIndex} Chart</h2>
          <Link href="/chart" style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--accent-light)', fontWeight: 600 }}>
            Full chart <ChevronRight size={13} />
          </Link>
        </div>
        <div className="card" style={{ height: 400, overflow: 'hidden' }}>
          <TradingViewWidget symbol={INDEX_CHART_SYMBOLS[selectedIndex] || '^NSEI'} />
        </div>
      </div> */}

      {/* ── News ─────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Newspaper size={16} color="var(--accent-light)" /> Latest News
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {latestNews.map((n) => (
            <div key={n.id} className="card card-hover" style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Newspaper size={15} color="var(--text-3)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.5, marginBottom: 6 }}>
                  {n.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--accent-light)',
                    background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{n.cat}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} /> {n.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

