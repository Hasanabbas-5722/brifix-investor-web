'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, ArrowUpRight, PieChart, Eye, EyeOff, BarChart3, RefreshCcw, TrendingUp, Loader2, Lock } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { usePlan } from '@/lib/context/PlanContext';

const summary = { totalValue: 12064308.5, investedValue: 10500000, todayPL: 128048, totalPL: 1564308.5, totalPLPct: 14.9 };

const holdings = [
  { sym: 'RELIANCE',   name: 'Reliance Industries', qty: 50,  avg: 2450, ltp: 2912.15, chg:  3.87, sector: 'Energy' },
  { sym: 'TCS',        name: 'Tata Consultancy',    qty: 30,  avg: 3200, ltp: 3485.60, chg:  1.24, sector: 'IT' },
  { sym: 'HDFCBANK',   name: 'HDFC Bank',           qty: 80,  avg: 1520, ltp: 1582.10, chg: -2.94, sector: 'Banking' },
  { sym: 'INFY',       name: 'Infosys',             qty: 60,  avg: 1380, ltp: 1423.85, chg: -1.85, sector: 'IT' },
  { sym: 'ICICIBANK',  name: 'ICICI Bank',          qty: 100, avg: 980,  ltp: 1082.45, chg:  2.15, sector: 'Banking' },
  { sym: 'BHARTIARTL', name: 'Bharti Airtel',       qty: 40,  avg: 1480, ltp: 1642.30, chg:  4.25, sector: 'Telecom' },
  { sym: 'ITC',        name: 'ITC Limited',         qty: 200, avg: 420,  ltp: 468.75,  chg:  1.12, sector: 'FMCG' },
];

const allocation = [
  { name: 'Banking', pct: 35, color: '#6366F1' },
  { name: 'IT',      pct: 25, color: '#818CF8' },
  { name: 'Energy',  pct: 18, color: '#F59E0B' },
  { name: 'Telecom', pct: 12, color: '#10B981' },
  { name: 'FMCG',    pct: 10, color: '#F43F5E' },
];

export default function PortfolioPage() {
  const { isFree } = usePlan();
  const [show, setShow] = useState(true);
  const [sort, setSort] = useState<'value' | 'change'>('value');
  const [holdingsList, setHoldingsList] = useState(holdings);
  const [portfolioSummary, setPortfolioSummary] = useState(summary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await authService.getAllHoldings();
      if (response.data && response.data.holdings) {
        setHoldingsList(response.data.holdings.map((h: any) => ({
          sym: h.symbol,
          name: h.name || h.symbol,
          qty: h.quantity,
          avg: h.averagePrice,
          ltp: h.ltp,
          chg: h.pChange,
          sector: h.sector || 'N/A'
        })));
        
        if (response.data.summary) {
          setPortfolioSummary({
            totalValue: response.data.summary.totalValue,
            investedValue: response.data.summary.investedValue,
            todayPL: response.data.summary.todayPL,
            totalPL: response.data.summary.totalPL,
            totalPLPct: response.data.summary.totalPLPct
          });
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => show ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹ ••••••';

  const sorted = [...holdingsList].sort((a, b) =>
    sort === 'change' ? Math.abs(b.chg) - Math.abs(a.chg) : b.ltp * b.qty - a.ltp * a.qty
  );

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={22} color="var(--accent-light)" /> Portfolio
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Your investment overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShow(!show)} className="btn-ghost" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Toggle visibility">
            {show ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button onClick={fetchPortfolio} className="btn-ghost" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Refresh">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="grid-4-lg">
        {[
          { label: 'Total Value',  value: fmt(portfolioSummary.totalValue),    green: false, sub: '' },
          { label: 'Invested',     value: fmt(portfolioSummary.investedValue), green: false, sub: '' },
          { label: "Today's P&L", value: fmt(portfolioSummary.todayPL),       green: portfolioSummary.todayPL >= 0,  sub: `${portfolioSummary.todayPL >= 0 ? '+' : ''}0.82%` },
          { label: 'Total P&L',   value: fmt(portfolioSummary.totalPL),       green: portfolioSummary.totalPL >= 0,  sub: `${portfolioSummary.totalPL >= 0 ? '+' : ''}${portfolioSummary.totalPLPct}%` },
        ].map(c => (
          <div key={c.label} className="card card-hover fade-up" style={{ padding: '18px 20px' }}>
            <p className="label" style={{ marginBottom: 8 }}>{c.label}</p>
            <p className="nums" style={{ fontSize: 18, fontWeight: 800, color: c.green ? 'var(--green)' : 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {c.green && <ArrowUpRight size={16} />}
              {c.value}
            </p>
            {c.sub && <span className="badge-green" style={{ marginTop: 6, display: 'inline-block' }}>{c.sub}</span>}
          </div>
        ))}
      </div>

      {/* Sector allocation & analytics */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={16} color="var(--text-2)" /> Sector Allocation & Risk
          </h3>
          {isFree ? (
            <Link
              href="/pricing"
              style={{
                fontSize: 10, fontWeight: 800, color: 'var(--accent-light)',
                background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.3)',
                padding: '3px 8px', borderRadius: 20, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Lock size={10} /> PRO ANALYTICS
            </Link>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', padding: '2px 8px', borderRadius: 20 }}>
              PRO UNLOCKED
            </span>
          )}
        </div>
        <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', background: 'var(--bg-elevated)', marginBottom: 16 }}>
          {allocation.map(s => (
            <div key={s.name} style={{ height: '100%', width: `${s.pct}%`, background: s.color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
          {allocation.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.name}</span>
              <span className="nums" style={{ fontSize: 12, fontWeight: 700 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
        {isFree && (
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              ⚡ Advanced risk attribution & Sharpe ratio analysis available on Pro plan.
            </span>
            <Link href="/pricing" style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', textDecoration: 'none' }}>
              Upgrade to Pro →
            </Link>
          </div>
        )}
      </div>

      {/* Holdings */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color="var(--text-2)" /> Holdings ({holdingsList.length})
          </h3>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, border: '1px solid var(--border)', gap: 2 }}>
            {(['value', 'change'] as const).map(s => (
              <button key={s} onClick={() => setSort(s)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: sort === s ? 'var(--accent)' : 'transparent',
                color: sort === s ? '#fff' : 'var(--text-3)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 580 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Stock</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Avg Price</th>
                <th style={{ textAlign: 'right' }}>LTP</th>
                <th style={{ textAlign: 'right' }}>Cur. Value</th>
                <th style={{ textAlign: 'right' }}>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(h => {
                const cv = h.qty * h.ltp;
                const pl = cv - h.qty * h.avg;
                const up = h.chg >= 0;
                return (
                  <tr key={h.sym}>
                    <td>
                      <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{h.sym}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{h.name}</p>
                    </td>
                    <td style={{ textAlign: 'right' }} className="nums">{h.qty}</td>
                    <td style={{ textAlign: 'right' }} className="nums">₹{h.avg.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <p className="nums" style={{ fontWeight: 700 }}>₹{h.ltp.toLocaleString()}</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: up ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                        {up ? '+' : ''}{h.chg}%
                      </p>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="nums" style={{ fontWeight: 700 }}>
                        {show ? `₹${cv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹ ••••••'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="nums" style={{ fontWeight: 800, color: pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {pl >= 0 ? '+' : ''}₹{Math.abs(pl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
