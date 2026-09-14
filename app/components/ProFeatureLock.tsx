'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Lock, CheckCircle2, Zap, Crown, ArrowRight, ShieldAlert } from 'lucide-react';
import { usePlan } from '@/lib/context/PlanContext';

interface ProFeatureLockProps {
  featureName?: string;
  requiredPlan?: 'pro' | 'premium';
}

export default function ProFeatureLock({
  featureName = 'AI Stock Predictions',
  requiredPlan = 'pro',
}: ProFeatureLockProps) {
  const { plan, setPlan } = usePlan();

  return (
    <div className="fade-in" style={{
      padding: '36px 24px',
      background: 'linear-gradient(180deg, rgba(20,27,45,0.95) 0%, rgba(15,21,32,0.98) 100%)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 20,
      boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: 640,
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative Glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 14px', borderRadius: 20,
        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
        marginBottom: 16,
      }}>
        <Lock size={12} color="var(--accent-light)" />
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-light)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {requiredPlan === 'premium' ? 'Premium Feature' : 'Pro Feature'}
        </span>
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8 }}>
        Unlock {featureName}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 480, marginBottom: 24 }}>
        You are currently on the <strong style={{ color: 'var(--text-2)' }}>Free Plan</strong>. Upgrade to <strong>Pro</strong> or <strong>Premium</strong> to unlock AI machine-learning price forecasts, daily stock purchase picks, and real-time technical trade signals.
      </p>

      {/* Plan comparison pill grid */}
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
        marginBottom: 26,
        textAlign: 'left',
      }}>
        {/* Free Plan status */}
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-2)' }}>Free Plan</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}>
              CURRENT
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> Basic market data
            </li>
            <li style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> NIFTY 50 tracking
            </li>
            <li style={{ fontSize: 11, color: 'rgba(244,63,94,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✕</span> No AI predictions
            </li>
          </ul>
        </div>

        {/* Pro Plan highlight */}
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> Pro Plan
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-light)' }}>
              ₹499/mo
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ fontSize: 11, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="var(--green)" /> <strong>AI predictions (50/day)</strong>
            </li>
            <li style={{ fontSize: 11, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="var(--green)" /> Price targets (1D, 5D, 15D, 30D)
            </li>
            <li style={{ fontSize: 11, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color="var(--green)" /> Stop-loss & Risk/Reward setups
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360 }}>
        <Link
          href="/pricing"
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'opacity 0.15s',
          }}
        >
          <span>Upgrade to Pro (₹499/mo)</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
