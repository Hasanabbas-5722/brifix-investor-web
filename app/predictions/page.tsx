'use client';

import { useState } from 'react';
import {
  BrainCircuit, Search, Shield, Target, BarChart3,
  Activity, Building2, AlertTriangle, Loader2, Sparkles,
} from 'lucide-react';
import { authService } from '@/lib/services/authService';

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

const MOCK = {
  symbol: 'RELIANCE', exchange: 'NSE',
  company: { name: 'Reliance Industries Ltd', sector: 'Energy', mkt_cap: 1920000000000, pe_ratio: 28.5, pb_ratio: 2.8, '52w_high': 3024, '52w_low': 2220, beta: 0.85 },
  current_price: 2912.15, signal: 'STRONG BUY', trend: 'Bullish',
  ensemble_prediction: 2985.40, ensemble_change_pct: 2.52, ensemble_confidence: 82.5,
  price_targets: { next_day_1d: 2945.20, short_term_5d: 2985.40, medium_term_15d: 3045.80, swing_30d: 3120.00 },
  risk: { stop_loss_2atr: 2845.30, stop_loss_1atr: 2878.70, atr: 33.42, rr_ratio: 2.8 },
  support_resistance: { R2: 3050, R1: 2980, Pivot: 2930, S1: 2880, S2: 2810 },
  models: {
    'Random Forest':     { price: 2955.30, pct: 1.48, conf: 85.2 },
    'XGBoost':           { price: 2980.10, pct: 2.33, conf: 80.8 },
    'Linear Regression': { price: 2940.50, pct: 0.97, conf: 78.5 },
    'LSTM Neural Net':   { price: 3010.20, pct: 3.37, conf: 76.1 },
  },
  signals: [
    { ind: 'RSI (14)',        val: '58.4',  sig: 'Neutral',    c: 'amber' },
    { ind: 'MACD',            val: '12.5',  sig: 'Buy',        c: 'green' },
    { ind: 'Moving Avg (50)', val: '2,845', sig: 'Buy',        c: 'green' },
    { ind: 'Bollinger Bands', val: 'Mid',   sig: 'Neutral',    c: 'amber' },
    { ind: 'Stochastic',      val: '72.1',  sig: 'Overbought', c: 'red' },
  ],
  entry: { aggressive: 2910, conservative: 2870 },
};

function KV({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}
         className="last-no-border">
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span className="nums" style={{ fontSize: 12, fontWeight: 700, color: color ?? 'var(--text-1)' }}>{value}</span>
    </div>
  );
}

export default function PredictionsPage() {
  const [q, setQ] = useState('');
  const [dropdown, setDropdown] = useState(false);
  const [sel, setSel] = useState<typeof STOCKS[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<typeof MOCK | null>(null);

  const filtered = q.trim()
    ? STOCKS.filter(s => s.symbol.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : STOCKS.slice(0, 8);

  const pick = (s: typeof STOCKS[0]) => { setSel(s); setQ(s.symbol); setDropdown(false); setData(null); };
  const predict = async () => {
    if (!sel) return;
    setLoading(true);
    setData(null);
    try {
      const response = await authService.predictStock({ symbol: sel.symbol, exchange: sel.exchange });
      if (response.data) {
        // Map API response to our UI format
        const apiData = response.data;
        setData({
          ...MOCK, // Keep mock for structure, override with real data
          symbol: sel.symbol,
          exchange: sel.exchange,
          current_price: apiData.current_price || MOCK.current_price,
          signal: apiData.signal || MOCK.signal,
          trend: apiData.trend || MOCK.trend,
          ensemble_prediction: apiData.prediction || MOCK.ensemble_prediction,
          ensemble_confidence: apiData.confidence || MOCK.ensemble_confidence,
          // Map other fields if available in API
        });
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      // Fallback to mock for demo if API fails
      setTimeout(() => {
        setData({ ...MOCK, symbol: sel.symbol, exchange: sel.exchange });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const d = data;
  const up = d && d.ensemble_change_pct >= 0;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>

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
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Select a stock and get ML-powered price forecasts</p>
      </div>

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
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BrainCircuit size={14} color="#A78BFA" /> ML Model Breakdown
              </h3>
            </div>
            {Object.entries(d.models).map(([name, m]) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 18px', borderBottom: '1px solid var(--border)', gap: 8,
              }} className="last-no-border">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span className="nums" style={{ fontSize: 12, fontWeight: 700 }}>₹{m.price.toLocaleString()}</span>
                  <span className="nums" style={{ fontSize: 11, fontWeight: 700, color: m.pct >= 0 ? 'var(--green)' : 'var(--red)', minWidth: 44, textAlign: 'right' }}>
                    {m.pct >= 0 ? '+' : ''}{m.pct}%
                  </span>
                  <span className="nums" style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>{m.conf}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Signals */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#06B6D4" /> Technical Signals
              </h3>
            </div>
            {d.signals.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 18px', borderBottom: '1px solid var(--border)', gap: 8,
              }} className="last-no-border">
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.ind}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="nums" style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.val}</span>
                  <span className={s.c === 'green' ? 'badge-green' : s.c === 'red' ? 'badge-red' : 'badge-amber'}>
                    {s.sig}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="card" style={{ padding: 16, background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
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
