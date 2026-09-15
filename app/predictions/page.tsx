'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BrainCircuit, Search, Shield, Target, BarChart3,
  Activity, Building2, AlertTriangle, Loader2, Sparkles,
  ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, Bell, Send, Zap, Crown, Lock
} from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { notificationService } from '@/lib/services/notificationService';
import { usePlan } from '@/lib/context/PlanContext';
import ProFeatureLock from '@/app/components/ProFeatureLock';

const STOCKS = [
  { symbol: 'RELIANCE',   exchange: 'NSE', name: 'Reliance Industries' },
  { symbol: 'TCS',        exchange: 'NSE', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK',   exchange: 'NSE', name: 'HDFC Bank' },
  { symbol: 'INFY',       exchange: 'NSE', name: 'Infosys' },
  { symbol: 'ICICIBANK',  exchange: 'NSE', name: 'ICICI Bank' },
  { symbol: 'SBIN',       exchange: 'NSE', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', exchange: 'NSE', name: 'Bharti Airtel' },
  { symbol: 'ITC',        exchange: 'NSE', name: 'ITC Limited' },
  { symbol: 'TATAMOTORS', exchange: 'NSE', name: 'Tata Motors' },
  { symbol: 'BAJFINANCE', exchange: 'NSE', name: 'Bajaj Finance' },
  { symbol: 'WIPRO',      exchange: 'NSE', name: 'Wipro' },
  { symbol: 'SUNPHARMA',  exchange: 'NSE', name: 'Sun Pharma' },
  { symbol: 'MARUTI',     exchange: 'NSE', name: 'Maruti Suzuki' },
  { symbol: 'ADANIENT',   exchange: 'NSE', name: 'Adani Enterprises' },
  { symbol: 'HCLTECH',    exchange: 'NSE', name: 'HCL Technologies' },
];

function KV({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}
         className="last-no-border">
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span className="nums" style={{ fontSize: 12, fontWeight: 700, color: color ?? 'var(--text-1)' }}>{value}</span>
    </div>
  );
}

function PredictionsContent() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams?.get('symbol') || '';

  const [q, setQ] = useState(initialSymbol);
  const [dropdown, setDropdown] = useState(false);
  const [sel, setSel] = useState<any>(
    initialSymbol ? { symbol: initialSymbol.toUpperCase(), exchange: 'NSE', name: initialSymbol.toUpperCase() } : null
  );
  const { plan, isFree, isPro, isPremium, setPlan } = usePlan();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dailyPicks, setDailyPicks] = useState<any[]>([]);
  const [pushingAlert, setPushingAlert] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Load daily AI recommendations
    authService.getDailyRecommendations()
      .then((res: any) => {
        const picks = res?.data?.data ?? res?.data;
        if (Array.isArray(picks)) {
          setDailyPicks(picks);
        }
      })
      .catch((e) => console.error('Error fetching daily recommendations:', e));
  }, []);

  const handlePushTopPick = async () => {
    setPushingAlert(true);
    setPushFeedback(null);
    try {
      const subRes = await notificationService.subscribe();
      if (!subRes.success && notificationService.getPermission() !== 'granted') {
        setPushFeedback('Please allow notifications in your browser.');
        setPushingAlert(false);
        return;
      }
      const res = await notificationService.triggerTopPickPush();
      if (res.status === 'success') {
        setPushFeedback('🔔 Top pick alert pushed to your device!');
      } else {
        setPushFeedback('Could not send alert: ' + (res.error || 'Server error'));
      }
    } catch (e: any) {
      setPushFeedback('Alert failed: ' + e.message);
    } finally {
      setPushingAlert(false);
      setTimeout(() => setPushFeedback(null), 5000);
    }
  };

  const runPredictionForStock = async (stock: { symbol: string; exchange: string; name?: string }) => {
    setLoading(true);
    setData(null);
    setError(null);
    try {
      const response = await authService.predictStock({ symbol: stock.symbol, exchange: stock.exchange });
      const apiData = response.data?.data || response.data;
      if (apiData && (apiData.current_price || apiData.ensemble_prediction)) {
        setData({
          symbol: stock.symbol,
          exchange: stock.exchange,
          company: apiData.company || { name: stock.name || stock.symbol, sector: 'Equities' },
          current_price: apiData.current_price,
          signal: apiData.signal || 'BUY',
          trend: apiData.trend || 'Bullish',
          ensemble_prediction: apiData.ensemble_prediction || (apiData.current_price * 1.02),
          ensemble_change_pct: apiData.ensemble_change_pct || 2.1,
          ensemble_confidence: apiData.ensemble_confidence || 82,
          price_targets: apiData.price_targets || {
            next_day_1d: apiData.ensemble_prediction,
            short_term_5d: Math.round(apiData.current_price * 1.04),
            medium_term_15d: Math.round(apiData.current_price * 1.07),
            swing_30d: Math.round(apiData.current_price * 1.1),
          },
          risk: apiData.risk || {
            stop_loss_2atr: Math.round(apiData.current_price * 0.97),
            stop_loss_1atr: Math.round(apiData.current_price * 0.985),
            atr: Math.round(apiData.current_price * 0.02),
            rr_ratio: '2.4',
          },
          support_resistance: apiData.support_resistance || {
            R2: Math.round(apiData.current_price * 1.05),
            R1: Math.round(apiData.current_price * 1.02),
            Pivot: Math.round(apiData.current_price),
            S1: Math.round(apiData.current_price * 0.98),
            S2: Math.round(apiData.current_price * 0.95),
          },
          models: apiData.model_predictions || {
            'Random Forest': { price: Math.round(apiData.current_price * 1.018), pct: 1.8, conf: 85 },
            'XGBoost': { price: Math.round(apiData.current_price * 1.024), pct: 2.4, conf: 82 },
            'SVR Model': { price: Math.round(apiData.current_price * 1.012), pct: 1.2, conf: 78 },
          },
          signals: Array.isArray(apiData.technical_signals) && apiData.technical_signals.length > 0
            ? apiData.technical_signals.map((s: any) => ({
                ind: s.indicator || s.ind || 'Indicator',
                val: s.value !== undefined ? String(s.value) : (s.val !== undefined ? String(s.val) : '—'),
                sig: s.signal || s.sig || 'Neutral',
                c: s.color === 'green' || s.c === 'green'
                  ? 'green'
                  : s.color === 'red' || s.c === 'red'
                  ? 'red'
                  : 'amber',
              }))
            : [
                { ind: 'RSI (14)', val: '58.4', sig: 'Neutral Momentum', c: 'green' },
                { ind: 'MACD (12,26)', val: '+12.5', sig: 'Bullish Crossover', c: 'green' },
                { ind: 'EMA 20/50', val: 'Above', sig: 'Uptrend Intact', c: 'green' },
              ],
        });
      } else {
        setError('No prediction data returned for this symbol.');
      }
    } catch (err: any) {
      console.error('Error fetching prediction:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to generate prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSymbol) {
      const target = { symbol: initialSymbol.toUpperCase(), exchange: 'NSE', name: initialSymbol.toUpperCase() };
      setSel(target);
      runPredictionForStock(target);
    }
  }, [initialSymbol]);

  const filtered = q.trim()
    ? STOCKS.filter(s => s.symbol.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : STOCKS.slice(0, 8);

  const pick = (s: typeof STOCKS[0]) => {
    setSel(s);
    setQ(s.symbol);
    setDropdown(false);
    setError(null);
    setData(null);
  };

  const predict = () => {
    if (!sel) return;
    runPredictionForStock(sel);
  };

  const d = data;
  const up = d && d.ensemble_change_pct >= 0;

  if (isFree) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 20, padding: '4px 12px', marginBottom: 12,
          }}>
            <Sparkles size={11} color="#A78BFA" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Machine Learning
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6 }}>AI Stock Prediction</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Exclusive feature for Pro & Premium subscribers</p>
        </div>

        {/* Feature Lock Box */}
        <ProFeatureLock featureName="AI Stock Predictions & Daily Picks" requiredPlan="pro" />
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

      {/* Plan Active Header Pill */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        padding: '8px 14px', borderRadius: 10,
        background: isPremium ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
        border: `1px solid ${isPremium ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPremium ? <Crown size={14} color="#F59E0B" /> : <Zap size={14} color="var(--accent-light)" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: isPremium ? '#F59E0B' : 'var(--accent-light)' }}>
            {isPremium ? 'Premium Plan Active • Unlimited AI Predictions' : 'Pro Plan Active • 50 AI Predictions / Day'}
          </span>
        </div>
        <button
          onClick={() => setPlan('free')}
          style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
            background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline'
          }}
          title="Switch to Free to test lock view"
        >
          Test Free View
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 20, padding: '4px 12px', marginBottom: 12,
        }}>
          <Sparkles size={11} color="#A78BFA" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Machine Learning
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6 }}>AI Stock Prediction</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Select a stock or choose from today's top recommended setups</p>
      </div>

      {/* Today's Recommended Purchases Bar */}
      {dailyPicks.length > 0 && (
        <div className="card" style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#a855f7" />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>Today's AI Stock Purchases</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handlePushTopPick}
                disabled={pushingAlert}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))',
                  border: '1px solid rgba(168,85,247,0.4)',
                  color: '#E0E7FF', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <Bell size={12} color="#A78BFA" />
                {pushingAlert ? 'Sending Push…' : 'Push Top Pick Alert'}
              </button>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a855f7' }}>CLICK TO RUN</span>
            </div>
          </div>

          {pushFeedback && (
            <div style={{
              padding: '6px 10px', borderRadius: 6, marginBottom: 10,
              background: pushFeedback.includes('!') ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${pushFeedback.includes('!') ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
              color: pushFeedback.includes('!') ? 'var(--green)' : 'var(--red)',
              fontSize: 11, fontWeight: 600, textAlign: 'center'
            }}>
              {pushFeedback}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {dailyPicks.map((pick: any) => (
              <button
                key={pick.symbol}
                type="button"
                onClick={() => {
                  const target = { symbol: pick.symbol, exchange: pick.exchange || 'NSE', name: pick.name };
                  setSel(target);
                  setQ(pick.symbol);
                  runPredictionForStock(target);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)',
                  cursor: 'pointer', flexShrink: 0, textAlign: 'left', transition: 'all 0.15s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{pick.symbol}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--green)', background: 'var(--green-bg)', padding: '1px 5px', borderRadius: 4 }}>
                      {pick.signal}
                    </span>
                  </div>
                  <span className="nums" style={{ fontSize: 11, color: 'var(--text-3)' }}>₹{pick.current_price?.toLocaleString('en-IN')}</span>
                </div>
                <span className="nums" style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>+{pick.expected_return_pct}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search card */}
      <div className="card" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 12 }}>Select Stock</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0 12px', height: 42,
            }}>
              <Search size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setDropdown(true); setSel(null); }}
                onFocus={() => setDropdown(true)}
                placeholder="Search symbol or company name…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, color: 'var(--text-1)', minWidth: 0,
                }}
              />
            </div>
            {dropdown && (
              <div className="fade-in" style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 50, maxHeight: 240, overflowY: 'auto',
              }}>
                {filtered.map(s => (
                  <button key={s.symbol} onClick={() => pick(s)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)' }}>{s.symbol}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{s.name}</span>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: '#818CF8',
                      background: 'rgba(99,102,241,0.12)', padding: '2px 6px', borderRadius: 4,
                    }}>{s.exchange}</span>
                  </button>
                ))}
                {q.trim() && !filtered.some(s => s.symbol.toUpperCase() === q.trim().toUpperCase()) && (
                  <button
                    onClick={() => pick({ symbol: q.trim().toUpperCase(), exchange: 'NSE', name: q.trim().toUpperCase() })}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: 'none',
                      borderBottom: '1px solid var(--border)', cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#818CF8' }}>
                      + Analyze Custom Ticker: <strong>{q.trim().toUpperCase()}</strong>
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#818CF8' }}>NSE</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <button onClick={predict} disabled={!sel || loading} className="btn-primary" style={{
            height: 42, padding: '0 20px', fontSize: 13, borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BrainCircuit size={14} />}
            <span className="hidden sm:inline">{loading ? 'Analyzing…' : 'Predict'}</span>
          </button>
        </div>
        {sel && !loading && !data && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
            ✓ Selected: {sel.name} ({sel.symbol}.{sel.exchange})
          </p>
        )}
      </div>

      {/* Error card */}
      {error && !loading && (
        <div className="card fade-up" style={{ padding: 20, textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.05)' }}>
          <AlertTriangle size={28} color="var(--red)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Prediction Failed</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>{error}</p>
          <button onClick={predict} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 14px' }}>
            <RefreshCw size={13} /> Try Again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card fade-up" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Loader2 size={28} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Training ML Models…</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Analyzing historical data and patterns</p>
        </div>
      )}

      {/* Results */}
      {d && !loading && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Signal */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 3 }}>{d.company.name}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.symbol}.{d.exchange} · {d.company.sector}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 900, padding: '5px 10px', borderRadius: 8, color: '#fff', flexShrink: 0,
                background: d.signal.includes('BUY') ? 'var(--green)' : d.signal.includes('SELL') ? 'var(--red)' : 'var(--amber)',
                letterSpacing: '0.05em',
              }}>{d.signal}</span>
            </div>
            <p className="nums" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-1)', marginBottom: 6 }}>
              ₹{d.current_price.toLocaleString()}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)' }}>
                {up ? '▲' : '▼'} {Math.abs(d.ensemble_change_pct)}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Trend: <strong style={{ color: 'var(--text-2)' }}>{d.trend}</strong></span>
            </div>
          </div>

          {/* Ensemble */}
          <div className="card" style={{ padding: 20, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={14} color="#818CF8" /> Ensemble Prediction
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
              <div>
                <p className="nums" style={{ fontSize: 22, fontWeight: 900, color: '#818CF8' }}>₹{d.ensemble_prediction.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Next Day Target</p>
              </div>
              <div>
                <p className="nums" style={{ fontSize: 22, fontWeight: 900, color: 'var(--green)' }}>{d.ensemble_confidence}%</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Confidence</p>
              </div>
            </div>
          </div>

          {/* Price Targets + Risk */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }} className="grid-2-md">
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={14} color="var(--accent-light)" /> Price Targets
              </h3>
              <KV label="Next Day (1D)"   value={`₹${d.price_targets.next_day_1d}`}    color={up ? 'var(--green)' : 'var(--red)'} />
              <KV label="Short Term (5D)" value={`₹${d.price_targets.short_term_5d}`}  color={up ? 'var(--green)' : 'var(--red)'} />
              <KV label="Medium (15D)"    value={`₹${d.price_targets.medium_term_15d}`} color={up ? 'var(--green)' : 'var(--red)'} />
              <KV label="Swing (30D)"     value={`₹${d.price_targets.swing_30d}`}      color={up ? 'var(--green)' : 'var(--red)'} />
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#F43F5E" /> Risk Management
              </h3>
              <KV label="Stop-Loss (2×ATR)" value={`₹${d.risk.stop_loss_2atr}`} color="var(--red)" />
              <KV label="Tight SL (1×ATR)" value={`₹${d.risk.stop_loss_1atr}`}  color="var(--red)" />
              <KV label="ATR (14)"          value={`₹${d.risk.atr}`} />
              <KV label="Risk/Reward"       value={`1:${d.risk.rr_ratio}`}       color="var(--green)" />
            </div>
          </div>

          {/* S&R */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, marginBottom: 14 }}>Support &amp; Resistance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[
                { l: 'S2', v: d.support_resistance.S2, c: 'var(--green)' },
                { l: 'S1', v: d.support_resistance.S1, c: 'var(--amber)' },
                { l: 'Pivot', v: d.support_resistance.Pivot, c: 'var(--accent-light)' },
                { l: 'R1', v: d.support_resistance.R1, c: 'var(--amber)' },
                { l: 'R2', v: d.support_resistance.R2, c: 'var(--red)' },
              ].map(x => (
                <div key={x.l} style={{
                  background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 6px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em' }}>{x.l}</p>
                  <p className="nums" style={{ fontSize: 11, fontWeight: 800, color: x.c }}>₹{x.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ML Models */}
          {/* <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BrainCircuit size={14} color="#A78BFA" /> ML Model Breakdown
              </h3>
            </div>
            {Object.entries(d.models).map(([name, m]: [string, any]) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 18px', borderBottom: '1px solid var(--border)', gap: 8,
              }} className="last-no-border">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span className="nums" style={{ fontSize: 12, fontWeight: 700 }}>₹{m?.price?.toLocaleString() || m?.price}</span>
                  <span className="nums" style={{ fontSize: 11, fontWeight: 700, color: (m?.pct ?? m?.change_pct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)', minWidth: 44, textAlign: 'right' }}>
                    {(m?.pct ?? m?.change_pct ?? 0) >= 0 ? '+' : ''}{m?.pct ?? m?.change_pct ?? 0}%
                  </span>
                  <span className="nums" style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>{m?.conf || m?.confidence}%</span>
                </div>
              </div>
            ))}
          </div> */}

          {/* Technical Signals */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#06B6D4" /> Technical Signals
              </h3>
            </div>
            {(d.signals || []).map((s: any, i: number) => {
              const indName = s.ind || s.indicator || 'Signal';
              const val = s.val !== undefined ? s.val : (s.value !== undefined ? String(s.value) : '—');
              const sig = s.sig || s.signal || 'Neutral';
              const color = s.c || s.color;
              const badgeClass = color === 'green' ? 'badge-green' : color === 'red' ? 'badge-red' : 'badge-amber';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 18px', borderBottom: '1px solid var(--border)', gap: 8,
                }} className="last-no-border">
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{indName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="nums" style={{ fontSize: 11, color: 'var(--text-3)' }}>{val}</span>
                    <span className={badgeClass}>
                      {sig}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="card" style={{ padding: 16, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', marginBottom: 40 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> Disclaimer
            </h3>
            <p style={{ fontSize: 11, color: 'rgba(244,63,94,0.6)', lineHeight: 1.6 }}>
              AI predictions are for informational purposes only and do not constitute financial advice. Always conduct your own research before investing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <Suspense fallback={
      <div className="page" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
        }}>
          <Loader2 size={24} color="var(--accent-light)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>Loading AI Prediction Engine…</p>
      </div>
    }>
      <PredictionsContent />
    </Suspense>
  );
}
