'use client';

import { useState } from 'react';
import { X, Shield, Key, Lock, CheckCircle, AlertTriangle, Sparkles, Building2, HelpCircle } from 'lucide-react';
import { authService } from '@/lib/services/authService';

interface BrokerConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (brokerInfo: any) => void;
  currentBroker?: string;
}

export default function BrokerConnectModal({
  isOpen,
  onClose,
  onConnected,
  currentBroker = 'paper'
}: BrokerConnectModalProps) {
  const [activeTab, setActiveTab] = useState<'angelone' | 'groww' | 'paper'>('angelone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Angel One form state
  const [angelCode, setAngelCode] = useState('');
  const [angelPin, setAngelPin] = useState('');
  const [angelTotp, setAngelTotp] = useState('');
  const [angelApiKey, setAngelApiKey] = useState('');

  // Groww form state
  const [growwApiKey, setGrowwApiKey] = useState('');
  const [growwTotp, setGrowwTotp] = useState('');

  if (!isOpen) return null;

  const handleConnectAngel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authService.connectBroker({
        broker: 'angelone',
        credentials: {
          client_code: angelCode.trim().toUpperCase(),
          pin: angelPin.trim(),
          totp_secret: angelTotp.trim().replace(/\s+/g, ''),
          api_key: angelApiKey.trim(),
        }
      });

      if (res.data?.status === 'success') {
        setSuccess('Successfully connected to Angel One!');
        setTimeout(() => {
          onConnected(res.data);
          onClose();
        }, 1200);
      } else {
        setError(res.data?.error || res.data?.message || 'Failed to connect to Angel One');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Could not authenticate with Angel One credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGroww = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authService.connectBroker({
        broker: 'groww',
        credentials: {
          api_key: growwApiKey.trim(),
          totp_secret: growwTotp.trim().replace(/\s+/g, ''),
        }
      });

      if (res.data?.status === 'success') {
        setSuccess('Successfully connected to Groww!');
        setTimeout(() => {
          onConnected(res.data);
          onClose();
        }, 1200);
      } else {
        setError(res.data?.error || res.data?.message || 'Failed to connect to Groww');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Could not authenticate with Groww credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePaper = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authService.connectBroker({ broker: 'paper' });
      if (res.data?.status === 'success') {
        setSuccess('Paper Trading Sandbox Activated (₹10,00,000 Balance)');
        setTimeout(() => {
          onConnected(res.data);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to activate paper trading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(5, 8, 15, 0.75)', backdropFilter: 'blur(8px)',
      padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 540,
        backgroundColor: '#0F1520', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={20} color="#6366F1" /> Connect Broker Account
            </h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>
              Link your broker to stream genuine quotes and automate orders
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: '#94A3B8',
              cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex', gap: 8, padding: '16px 24px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {[
            { id: 'angelone', label: 'Angel One', icon: Shield },
            { id: 'groww', label: 'Groww', icon: Key },
            { id: 'paper', label: 'Paper Sandbox', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setError(''); setSuccess(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 14px', fontSize: 13, fontWeight: 600,
                  color: active ? '#6366F1' : '#94A3B8',
                  background: 'transparent', border: 'none',
                  borderBottom: active ? '2px solid #6366F1' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  paddingBottom: 12
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)', color: '#F43F5E', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {/* Tab 1: Angel One */}
          {activeTab === 'angelone' && (
            <form onSubmit={handleConnectAngel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  Client Code (User ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A123456"
                  value={angelCode}
                  onChange={e => setAngelCode(e.target.value)}
                  required
                  style={{
                    width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                    MPIN (4 digits)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={angelPin}
                    onChange={e => setAngelPin(e.target.value)}
                    required
                    style={{
                      width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                    TOTP Secret <HelpCircle size={12} title="32-character key from Angel One App Settings -> TOTP" />
                  </label>
                  <input
                    type="password"
                    placeholder="Base32 Secret Key"
                    value={angelTotp}
                    onChange={e => setAngelTotp(e.target.value)}
                    required
                    style={{
                      width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  SmartAPI Key
                </label>
                <input
                  type="text"
                  placeholder="From SmartAPI Developer Portal"
                  value={angelApiKey}
                  onChange={e => setAngelApiKey(e.target.value)}
                  required
                  style={{
                    width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Lock size={12} color="#10B981" /> All credentials are encrypted with AES-256 before storage.
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 42, marginTop: 6,
                  backgroundColor: '#6366F1', color: '#FFFFFF',
                  fontWeight: 600, fontSize: 13, border: 'none',
                  borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Authenticating with Angel One...' : 'Verify & Connect Angel One'}
              </button>
            </form>
          )}

          {/* Tab 2: Groww */}
          {activeTab === 'groww' && (
            <form onSubmit={handleConnectGroww} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  Groww API Key / Auth Token
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter Groww API token"
                  value={growwApiKey}
                  onChange={e => setGrowwApiKey(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8, color: '#F8FAFC', fontSize: 12, outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#CBD5E1', marginBottom: 6 }}>
                  Groww TOTP Secret
                </label>
                <input
                  type="password"
                  placeholder="Base32 TOTP secret"
                  value={growwTotp}
                  onChange={e => setGrowwTotp(e.target.value)}
                  required
                  style={{
                    width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8, color: '#F8FAFC', fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 42, marginTop: 6,
                  backgroundColor: '#6366F1', color: '#FFFFFF',
                  fontWeight: 600, fontSize: 13, border: 'none',
                  borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Authenticating with Groww...' : 'Verify & Connect Groww'}
              </button>
            </form>
          )}

          {/* Tab 3: Paper Sandbox */}
          {activeTab === 'paper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
              }}>
                <Sparkles size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  Virtual Paper Trading Sandbox
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '8px 0 0', lineHeight: 1.5 }}>
                  Practice and test automated algorithms with <strong>₹10,00,000 virtual balance</strong> using genuine live market prices without risking real money.
                </p>
              </div>

              <div style={{
                padding: '12px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', fontSize: 12, color: '#CBD5E1'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94A3B8' }}>Virtual Starting Balance:</span>
                  <strong style={{ color: '#10B981' }}>₹10,00,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94A3B8' }}>Execution Speed:</span>
                  <span>Instant Market LTP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Capital Risk:</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>0% (Risk Free)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleActivatePaper}
                disabled={loading}
                style={{
                  height: 42,
                  backgroundColor: '#10B981', color: '#FFFFFF',
                  fontWeight: 600, fontSize: 13, border: 'none',
                  borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Activating...' : 'Activate Paper Trading Sandbox'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
