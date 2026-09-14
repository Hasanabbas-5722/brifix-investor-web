'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Send, Sparkles, TrendingUp, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { notificationService, TopPickData } from '@/lib/services/notificationService';
import Link from 'next/link';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);
  const [topPick, setTopPick] = useState<TopPickData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(notificationService.getPermission());
      loadTopPick();
      notificationService.registerServiceWorker();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadTopPick = async () => {
    const data = await notificationService.getTopPick();
    if (data) {
      setTopPick(data);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const result = await notificationService.subscribe();
      setPermission(notificationService.getPermission());
      if (result.success) {
        setStatusMsg({ text: 'Push notifications enabled successfully! 🔔', type: 'success' });
      } else {
        setStatusMsg({ text: result.error || 'Failed to subscribe', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error subscribing', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setSendingPush(true);
    setStatusMsg(null);
    try {
      // If permission not granted yet, try to subscribe first
      if (permission !== 'granted') {
        const subRes = await notificationService.subscribe();
        setPermission(notificationService.getPermission());
        if (!subRes.success) {
          setStatusMsg({ text: subRes.error || 'Permission needed to receive push alerts', type: 'error' });
          setSendingPush(false);
          return;
        }
      }

      const res = await notificationService.triggerTopPickPush();
      if (res.status === 'success') {
        setStatusMsg({ text: 'Push alert sent to your device! 🚀 Check your notifications.', type: 'success' });
      } else {
        setStatusMsg({ text: res.error || 'Failed to dispatch push notification', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to send alert', type: 'error' });
    } finally {
      setSendingPush(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fade-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 0,
        width: 380,
        maxWidth: 'calc(100vw - 32px)',
        background: '#131A29',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(99,102,241,0.15)',
        zIndex: 9999,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bell size={16} color="var(--accent-light)" />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              AI Stock Alerts
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Instant push notifications for top picks
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Permission Status Banner */}
      <div style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: permission === 'granted' ? 'rgba(34,197,94,0.08)' : 'rgba(99,102,241,0.08)',
        border: `1px solid ${permission === 'granted' ? 'rgba(34,197,94,0.25)' : 'rgba(99,102,241,0.25)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {permission === 'granted' ? (
            <ShieldCheck size={16} color="var(--green)" />
          ) : (
            <AlertCircle size={16} color="var(--accent-light)" />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: permission === 'granted' ? 'var(--green)' : 'var(--text-2)' }}>
            {permission === 'granted' ? 'Push Notifications Active' : 'Notifications Disabled'}
          </span>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Enabling…' : 'Enable'}
          </button>
        )}
      </div>

      {/* Top Pick Highlight Card */}
      {topPick && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} color="#F59E0B" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F59E0B' }}>
                Today's #1 AI Recommendation
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
              background: 'rgba(34,197,94,0.15)', color: 'var(--green)',
            }}>
              {topPick.confidence}% CONFIDENCE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-1)' }}>
                {topPick.symbol}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {topPick.name} • {topPick.sector}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }} className="nums">
                ₹{topPick.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }} className="nums">
                Target: ₹{topPick.target_5d.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (+{topPick.expected_return_pct}%)
              </div>
            </div>
          </div>

          {topPick.rationale && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0', lineHeight: 1.4 }}>
              💡 {topPick.rationale}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link
              href={`/predictions?symbol=${topPick.symbol}`}
              onClick={onClose}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none'
              }}
            >
              Analyze Prediction <ExternalLink size={11} />
            </Link>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              SL: ₹{topPick.stop_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Action Button: Send Test Push Notification */}
      <button
        onClick={handleSendTestPush}
        disabled={sendingPush}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          border: 'none',
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
          transition: 'opacity 0.15s',
        }}
      >
        <Send size={14} />
        {sendingPush ? 'Sending Push Notification…' : 'Send Top Pick Alert to Device'}
      </button>

      {/* Status Feedback Message */}
      {statusMsg && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          background: statusMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
          color: statusMsg.type === 'success' ? 'var(--green)' : 'var(--red)',
          textAlign: 'center',
        }}>
          {statusMsg.text}
        </div>
      )}
    </div>
  );
}
