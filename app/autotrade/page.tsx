'use client';

import { useState, useEffect } from 'react';
import {
  Cpu, Power, ShieldAlert, CheckCircle2, RefreshCw, AlertOctagon,
  Building2, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign,
  Sliders, Lock, Info, Activity, History, Play, Pause, Layers, Zap, Sparkles
} from 'lucide-react';
import { authService } from '@/lib/services/authService';
import BrokerConnectModal from '../components/BrokerConnectModal';

export default function AutoTradePage() {
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [brokerInfo, setBrokerInfo] = useState<any>({
    active_broker: 'paper',
    profile: { name: 'Paper Trading Sandbox', client_code: 'PAPER-SANDBOX', is_paper: true },
    margin: { available_cash: 1000000, used_margin: 0, total_balance: 1000000, is_paper: true }
  });

  const [config, setConfig] = useState({
    enabled: false,
    tradeMode: 'paper',
    maxCapitalPerTrade: 10000,
    riskRewardRatio: 2.0,
    stopLossPct: 1.5,
    takeProfitPct: 3.0,
    trailingStopLoss: true,
    dailyMaxLoss: 5000,
    dailyRealizedPnL: 0.0,
    maxOpenTrades: 3,
  });

  const [positions, setPositions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [totalUnrealizedPnL, setTotalUnrealizedPnL] = useState(0);

  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history' | 'settings'>('overview');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadPositions();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadBrokerStatus(),
      loadConfig(),
      loadPositions(),
      loadHistory()
    ]);
    setLoading(false);
  };

  const loadBrokerStatus = async () => {
    try {
      const res = await authService.getBrokerStatus();
      if (res.data?.status === 'success') {
        setBrokerInfo(res.data);
      }
    } catch {}
  };

  const loadConfig = async () => {
    try {
      const res = await authService.getAutoTradeConfig();
      if (res.data?.status === 'success' && res.data?.config) {
        setConfig(prev => ({ ...prev, ...res.data.config }));
      }
    } catch {}
  };

  const loadPositions = async () => {
    try {
      const res = await authService.getAutoTradePositions();
      if (res.data?.status === 'success') {
        setPositions(res.data.positions || []);
        setTotalUnrealizedPnL(res.data.total_unrealized_pnl || 0);
      }
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const res = await authService.getAutoTradeHistory();
      if (res.data?.status === 'success') {
        setHistory(res.data.history || []);
      }
    } catch {}
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const newStatus = !config.enabled;
      if (newStatus) {
        setStatusMsg('Activating AI Auto-Trader: Predicting Indian stocks for >80% confidence setups...');
      }
      const res = await authService.toggleAutoTrade(newStatus);
      if (res.data?.status === 'success') {
        setConfig(prev => ({ ...prev, enabled: res.data.enabled }));
        const evalRes = res.data.eval_result || {};
        const qualified = evalRes.qualified_picks || [];
        if (newStatus && qualified.length > 0) {
          const names = qualified.map((q: any) => `${q.symbol} (${q.confidence}%)`).join(', ');
          setStatusMsg(`Auto-Trader Activated! AI Selected (>80%): ${names}. Placed ${evalRes.new_positions?.length || 0} automated trades.`);
        } else {
          setStatusMsg(res.data.message);
        }
        setTimeout(() => setStatusMsg(''), 6000);
        await Promise.all([loadPositions(), loadBrokerStatus(), loadHistory()]);
        setTimeout(() => { loadPositions(); loadBrokerStatus(); }, 1500);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to toggle automated trading');
    } finally {
      setToggling(false);
    }
  };

  const handleScanAndTrade = async () => {
    setScanning(true);
    setStatusMsg('Scanning top Indian stocks with AI prediction models (>80% confidence)...');
    try {
      const res = await authService.scanAndExecuteAutoTrade();
      if (res.data?.status === 'success') {
        const result = res.data.result || {};
        const newPositions = result.new_positions || [];
        const qualified = result.qualified_picks || [];
        
        let msg = res.data.message;
        if (qualified.length > 0) {
          const names = qualified.map((q: any) => `${q.symbol} (${q.confidence}%)`).join(', ');
          msg = `AI Qualified (>80%): ${names}. Placed ${newPositions.length} automated positions.`;
        }
        setStatusMsg(msg);
        setTimeout(() => setStatusMsg(''), 6000);
        await Promise.all([loadPositions(), loadBrokerStatus(), loadHistory()]);
      } else {
        setStatusMsg(res.data?.message || 'Scan completed.');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await authService.updateAutoTradeConfig({
        ...config,
        takeProfitPct: +(config.stopLossPct * config.riskRewardRatio).toFixed(2)
      });
      if (res.data?.status === 'success') {
        setConfig(prev => ({ ...prev, ...res.data.config }));
        setStatusMsg('Risk settings successfully updated & applied to active engine.');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEmergencyExit = async () => {
    if (!confirm('EMERGENCY STOP: Are you sure you want to instantly square off all open positions at market price and halt automated trading?')) {
      return;
    }
    try {
      const res = await authService.emergencyExitAutoTrade();
      alert(res.data?.message || 'Emergency exit executed.');
      setConfig(prev => ({ ...prev, enabled: false }));
      loadPositions();
      loadHistory();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Emergency exit failed');
    }
  };

  const calculatedTP = +(config.stopLossPct * config.riskRewardRatio).toFixed(2);

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto' }}>

      {/* Top Banner / Master Switch */}
      <div className="card" style={{
        padding: '24px',
        background: config.enabled
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: config.enabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: config.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            color: config.enabled ? '#10B981' : '#94A3B8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: config.enabled ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
          }}>
            <Cpu size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                Algorithmic Auto-Trading
              </h1>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: config.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                color: config.enabled ? '#10B981' : '#94A3B8',
                border: config.enabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: config.enabled ? '#10B981' : '#94A3B8',
                  boxShadow: config.enabled ? '0 0 8px #10B981' : 'none'
                }} />
                {config.enabled ? 'AUTOMATION ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
              Automated high-probability order execution with strict Risk-Reward protection & Trailing Stop-Loss.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleToggle}
            disabled={toggling}
            style={{
              padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              backgroundColor: config.enabled ? '#F43F5E' : '#10B981',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: config.enabled ? '0 4px 14px rgba(244, 63, 94, 0.35)' : '0 4px 14px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {config.enabled ? <Pause size={16} /> : <Play size={16} />}
            {config.enabled ? 'Pause Auto-Trading' : 'Enable Automated Trading'}
          </button>

          {config.enabled && (
            <button
              onClick={handleScanAndTrade}
              disabled={scanning}
              title="Scan top Indian stocks with AI models and auto-execute positions with >80% confidence"
              style={{
                padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818CF8',
                border: '1px solid rgba(99, 102, 241, 0.4)', cursor: scanning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={16} />
              {scanning ? 'Analyzing Stocks...' : 'Scan & Trade AI Signals (>80%)'}
            </button>
          )}

          {config.enabled && (
            <button
              onClick={handleEmergencyExit}
              title="Emergency Stop & Square Off All Positions Immediately"
              style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E',
                border: '1px solid rgba(244, 63, 94, 0.35)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <AlertOctagon size={16} /> Panic Kill-Switch
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818CF8', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      {/* Metric Cards Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16
      }}>
        {/* Connected Broker Card */}
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Active Execution Account</span>
            <Building2 size={16} color="#6366F1" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
                {brokerInfo.profile?.name || (brokerInfo.active_broker === 'angelone' ? 'Angel One' : 'Paper Sandbox')}
              </div>
              <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>
                ● {brokerInfo.profile?.client_code || 'Connected'}
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8',
                border: '1px solid rgba(99, 102, 241, 0.25)', cursor: 'pointer'
              }}
            >
              Switch Account
            </button>
          </div>
        </div>

        {/* Available Funds Card */}
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Available Trading Capital</span>
            <DollarSign size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>
            ₹{brokerInfo.margin?.available_cash?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '10,00,000.00'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Used Margin: ₹{brokerInfo.margin?.used_margin?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
          </div>
        </div>

        {/* Risk-Reward Protection Card */}
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Risk-to-Reward Setup</span>
            <Sliders size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>
            1 : {config.riskRewardRatio}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Cut Loss at <strong style={{ color: '#F43F5E' }}>-{config.stopLossPct}%</strong> | Target at <strong style={{ color: '#10B981' }}>+{calculatedTP}%</strong>
          </div>
        </div>

        {/* Daily P&L Metric */}
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>Today's Realized P&L</span>
            <Activity size={16} color={config.dailyRealizedPnL >= 0 ? '#10B981' : '#F43F5E'} />
          </div>
          <div style={{
            fontSize: 20, fontWeight: 800,
            color: config.dailyRealizedPnL >= 0 ? '#10B981' : '#F43F5E'
          }}>
            {config.dailyRealizedPnL >= 0 ? '+' : ''}₹{config.dailyRealizedPnL?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Daily Circuit Breaker: ₹{config.dailyMaxLoss?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 8 }}>
        {[
          { id: 'overview', label: 'Overview & Positions', count: positions.length },
          { id: 'settings', label: 'Risk & Strategy Settings' },
          { id: 'history', label: 'Trade Audit Log', count: history.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: activeTab === t.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === t.id ? '#818CF8' : 'var(--text-3)',
              border: activeTab === t.id ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer'
            }}
          >
            {t.label} {t.count !== undefined && <span style={{ opacity: 0.7, fontSize: 11 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ACTIVE POSITIONS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                  Active Automated Positions ({positions.length})
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
                  Monitored tick-by-tick against Target and Trailing Stop-Loss
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Unrealized P&L:</span>
                <div style={{
                  fontSize: 16, fontWeight: 800,
                  color: totalUnrealizedPnL >= 0 ? '#10B981' : '#F43F5E'
                }}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}₹{totalUnrealizedPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {positions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <Cpu size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No active open positions</p>
                <p style={{ fontSize: 12, margin: '6px 0 16px', opacity: 0.8 }}>
                  {config.enabled
                    ? 'Automation is active. Click below to analyze top Indian stocks and auto-execute positions with >80% AI confidence.'
                    : 'Enable automated trading to start scanning for high-probability setups.'}
                </p>
                {config.enabled && (
                  <button
                    onClick={handleScanAndTrade}
                    disabled={scanning}
                    style={{
                      padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                    }}
                  >
                    <Zap size={15} /> {scanning ? 'Analyzing Indian Stocks...' : 'Scan & Trade Top Signals (>80% Conf)'}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-3)' }}>
                      <th style={{ padding: '10px 12px' }}>Symbol</th>
                      <th style={{ padding: '10px 12px' }}>Quantity</th>
                      <th style={{ padding: '10px 12px' }}>Entry Price</th>
                      <th style={{ padding: '10px 12px' }}>Current LTP</th>
                      <th style={{ padding: '10px 12px' }}>Trailing Stop-Loss</th>
                      <th style={{ padding: '10px 12px' }}>Target Price</th>
                      <th style={{ padding: '10px 12px' }}>Unrealized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(p => {
                      const isUp = p.pnl >= 0;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-1)' }}>
                            {p.symbol}
                            <span style={{
                              fontSize: 11, marginLeft: 8, fontWeight: 800,
                              color: p.ai_confidence >= 85 ? '#10B981' : '#818CF8',
                              background: p.ai_confidence >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                              border: p.ai_confidence >= 85 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                              padding: '2px 8px', borderRadius: 6
                            }}>
                              AI {p.ai_confidence}%
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-2)' }}>{p.quantity}</td>
                          <td style={{ padding: '12px', color: 'var(--text-2)' }}>₹{p.entry_price?.toFixed(2)}</td>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-1)' }}>₹{p.current_price?.toFixed(2)}</td>
                          <td style={{ padding: '12px', color: '#F43F5E' }}>₹{p.stop_loss_price?.toFixed(2)}</td>
                          <td style={{ padding: '12px', color: '#10B981' }}>₹{p.target_price?.toFixed(2)}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: isUp ? '#10B981' : '#F43F5E' }}>
                            {isUp ? '+' : ''}₹{p.pnl?.toFixed(2)} ({isUp ? '+' : ''}{p.pnl_pct?.toFixed(2)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RISK & STRATEGY SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
              Risk Management & Automated Parameters
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
              Define position sizing, risk-to-reward ratio, stop-loss protection, and daily circuit breaker.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Risk-Reward Ratio */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Risk-to-Reward Ratio (R:R)
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[1.5, 2.0, 2.5, 3.0].map(rr => (
                  <button
                    key={rr}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, riskRewardRatio: rr }))}
                    style={{
                      flex: 1, minWidth: 70, height: 38, borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: config.riskRewardRatio === rr ? '#6366F1' : 'rgba(255, 255, 255, 0.04)',
                      color: config.riskRewardRatio === rr ? '#FFFFFF' : 'var(--text-2)',
                      border: config.riskRewardRatio === rr ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer'
                    }}
                  >
                    1 : {rr} {rr === 2.0 ? '★' : ''}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Ensures potential gains are {config.riskRewardRatio}x larger than maximum loss on every trade.
              </p>
            </div>

            {/* Stop Loss Percentage */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Stop-Loss Percentage (SL %)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={config.stopLossPct}
                  onChange={e => setConfig(prev => ({ ...prev, stopLossPct: parseFloat(e.target.value) || 1.5 }))}
                  required
                  style={{
                    width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: '#F43F5E', marginTop: 6 }}>
                Hard cut-loss at -{config.stopLossPct}%. Automatically sets Target Price to +{calculatedTP}%.
              </p>
            </div>

            {/* Max Capital Per Trade */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Max Capital per Trade (₹)
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                max="500000"
                value={config.maxCapitalPerTrade}
                onChange={e => setConfig(prev => ({ ...prev, maxCapitalPerTrade: parseFloat(e.target.value) || 10000 }))}
                required
                style={{
                  width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                Maximum allocation per position.
              </p>
            </div>

            {/* Daily Circuit Breaker */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                Daily Loss Circuit Breaker (₹)
              </label>
              <input
                type="number"
                step="500"
                min="1000"
                max="100000"
                value={config.dailyMaxLoss}
                onChange={e => setConfig(prev => ({ ...prev, dailyMaxLoss: parseFloat(e.target.value) || 5000 }))}
                required
                style={{
                  width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                If daily cumulative loss hits this limit, automation halts immediately for the day.
              </p>
            </div>
          </div>

          {/* Trailing Stop-Loss Toggle */}
          <div style={{
            padding: '16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Trailing Stop-Loss Protection</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                As stock prices rise, automatically ratchet the stop-loss upward to lock in profits and prevent winning trades from turning negative.
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.trailingStopLoss}
              onChange={e => setConfig(prev => ({ ...prev, trailingStopLoss: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#6366F1' }}
            />
          </div>

          <button
            type="submit"
            disabled={savingConfig}
            style={{
              alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 8,
              backgroundColor: '#6366F1', color: '#FFFFFF', fontWeight: 600, fontSize: 13,
              border: 'none', cursor: savingConfig ? 'not-allowed' : 'pointer'
            }}
          >
            {savingConfig ? 'Saving Settings...' : 'Save & Apply Risk Settings'}
          </button>
        </form>
      )}

      {/* TAB 3: TRADE AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Automated Trade Execution History
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
                Complete audit trail of all automated entry and exit orders
              </p>
            </div>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              <History size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No closed trade history yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-3)' }}>
                    <th style={{ padding: '10px 12px' }}>Symbol</th>
                    <th style={{ padding: '10px 12px' }}>Quantity</th>
                    <th style={{ padding: '10px 12px' }}>Entry Price</th>
                    <th style={{ padding: '10px 12px' }}>Exit Price</th>
                    <th style={{ padding: '10px 12px' }}>Exit Reason</th>
                    <th style={{ padding: '10px 12px' }}>Realized P&L</th>
                    <th style={{ padding: '10px 12px' }}>Exit Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => {
                    const isUp = h.pnl >= 0;
                    return (
                      <tr key={h.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{h.symbol}</td>
                        <td style={{ padding: '12px', color: 'var(--text-2)' }}>{h.quantity}</td>
                        <td style={{ padding: '12px', color: 'var(--text-2)' }}>₹{h.entry_price?.toFixed(2)}</td>
                        <td style={{ padding: '12px', color: 'var(--text-1)' }}>₹{h.exit_price?.toFixed(2)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                            background: h.exit_reason === 'TARGET_HIT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: h.exit_reason === 'TARGET_HIT' ? '#10B981' : '#F43F5E'
                          }}>
                            {h.exit_reason}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: isUp ? '#10B981' : '#F43F5E' }}>
                          {isUp ? '+' : ''}₹{h.pnl?.toFixed(2)} ({isUp ? '+' : ''}{h.pnl_pct?.toFixed(2)}%)
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-3)', fontSize: 11 }}>
                          {h.exit_time ? new Date(h.exit_time).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Broker Connect Modal */}
      <BrokerConnectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnected={(b) => {
          setBrokerInfo(b);
          loadBrokerStatus();
        }}
        currentBroker={brokerInfo.active_broker}
      />
    </div>
  );
}
