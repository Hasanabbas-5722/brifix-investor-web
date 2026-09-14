'use client';

import { useState } from 'react';
import { Check, Star, Zap, Crown, Sparkles, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { usePlan, PlanType } from '@/lib/context/PlanContext';

const plans = [
  {
    id: 'free' as PlanType,
    name: 'Free', price: 0, period: '/forever', desc: 'Get started with basic features',
    Icon: Star, from: '#475569', to: '#64748B',
    features: ['Basic market data', 'NIFTY 50 tracking', 'Limited news feed', '1 watchlist (10 stocks)', 'Community support'],
    popular: false,
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro', price: 499, period: '/month', desc: 'For serious investors',
    Icon: Zap, from: '#6366F1', to: '#818CF8',
    features: ['Everything in Free', 'Real-time market data', 'AI predictions (50/day)', 'Advanced TradingView charts', 'Portfolio analytics', '10 watchlists', 'Price alerts'],
    popular: true,
  },
  {
    id: 'premium' as PlanType,
    name: 'Premium', price: 999, period: '/month', desc: 'Maximum power & insights',
    Icon: Crown, from: '#D97706', to: '#F59E0B',
    features: ['Everything in Pro', 'Unlimited AI predictions', 'Options chain analysis', 'Institutional flow data', 'Custom screeners', 'API access', 'Dedicated support'],
    popular: false,
  },
];

const faqs = [
  { q: 'Can I cancel anytime?',               a: 'Yes! Cancel anytime. Your access continues until the end of the billing period.' },
  { q: 'Is there a free trial?',              a: 'Use coupon code TRIAL15 to get 15 days of Premium access absolutely free!' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and all major wallets through Razorpay.' },
];

export default function PricingPage() {
  const { plan, setPlan } = usePlan();
  const [yr, setYr] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSelectPlan = (targetPlan: PlanType) => {
    if (targetPlan === plan) return;
    setPlan(targetPlan);
    const planName = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);
    setFeedback(`Active plan updated to ${planName}! Features updated.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 960 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 20, padding: '4px 12px', marginBottom: 14,
        }}>
          <Sparkles size={11} color="#F59E0B" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Special Launch Pricing
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-1)', marginBottom: 8 }}>Choose Your Plan</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 400, margin: '0 auto 20px' }}>
          Unlock powerful trading tools, AI predictions, and real-time market insights
        </p>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: !yr ? 'var(--text-1)' : 'var(--text-3)' }}>Monthly</span>
          <button onClick={() => setYr(!yr)} style={{
            width: 44, height: 24, borderRadius: 12, position: 'relative',
            background: yr ? 'var(--accent)' : 'var(--bg-elevated)',
            border: `1px solid ${yr ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{
              position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'transform 0.2s',
              transform: yr ? 'translateX(22px)' : 'translateX(2px)',
            }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: yr ? 'var(--text-1)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Yearly <span className="badge-green">Save 20%</span>
          </span>
        </div>

        {/* Active Plan Selector & Feedback */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '12px 18px', borderRadius: 14,
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          maxWidth: 480, margin: '20px auto 0', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)' }}>Current Active Plan:</span>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
              background: plan === 'premium' ? 'rgba(245,158,11,0.15)' : plan === 'pro' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
              color: plan === 'premium' ? '#F59E0B' : plan === 'pro' ? 'var(--accent-light)' : 'var(--text-2)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {plan}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)' }}>
            <span>Quick test switch:</span>
            {(['free', 'pro', 'premium'] as const).map(pKey => (
              <button
                key={pKey}
                onClick={() => handleSelectPlan(pKey)}
                style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', cursor: 'pointer',
                  border: plan === pKey ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: plan === pKey ? 'var(--accent-dim)' : 'transparent',
                  color: plan === pKey ? 'var(--accent-light)' : 'var(--text-3)',
                }}
              >
                {pKey}
              </button>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="fade-in" style={{
            padding: '10px 16px', borderRadius: 10,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
            color: 'var(--green)', fontSize: 13, fontWeight: 600, textAlign: 'center',
            maxWidth: 480, margin: '14px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <CheckCircle2 size={16} />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="grid-3-md">
        {plans.map(p => {
          const isCurrent = plan === p.id;
          const price = yr && p.price > 0 ? Math.round(p.price * 0.8 * 12) : p.price;
          const period = yr && p.price > 0 ? '/year' : p.period;

          let ctaText = 'Select Plan';
          if (isCurrent) {
            ctaText = 'Current Plan';
          } else if (p.id === 'free') {
            ctaText = 'Downgrade to Free';
          } else if (p.id === 'pro') {
            ctaText = 'Upgrade to Pro';
          } else if (p.id === 'premium') {
            ctaText = 'Go Premium';
          }

          return (
            <div key={p.name} className="card card-hover fade-up" style={{
              padding: '28px 24px', display: 'flex', flexDirection: 'column',
              position: 'relative',
              border: isCurrent
                ? '1px solid rgba(34,197,94,0.4)'
                : p.popular
                ? '1px solid rgba(99,102,241,0.4)'
                : '1px solid var(--border)',
              boxShadow: isCurrent
                ? '0 0 32px rgba(34,197,94,0.12)'
                : p.popular
                ? '0 0 32px rgba(99,102,241,0.12)'
                : 'none',
            }}>
              {isCurrent ? (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--green)', color: '#000',
                  fontSize: 10, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
                }}>Current Plan</div>
              ) : p.popular ? (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 10, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                }}>Most Popular</div>
              ) : null}

              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px ${p.from}44`,
              }}>
                <p.Icon size={20} color="#fff" />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>{p.desc}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                <span className="nums" style={{ fontSize: 32, fontWeight: 900 }}>
                  {p.price === 0 ? '₹0' : `₹${price.toLocaleString()}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{period}</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                    <Check size={15} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrent}
                className={isCurrent ? 'btn-ghost' : p.popular ? 'btn-primary' : 'btn-ghost'}
                style={{
                  height: 44, fontSize: 13, borderRadius: 10, width: '100%',
                  cursor: isCurrent ? 'default' : 'pointer',
                  opacity: isCurrent ? 0.75 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontWeight: 700,
                }}
              >
                {isCurrent && <CheckCircle2 size={15} color="var(--green)" />}
                {ctaText}
              </button>
            </div>
          );
        })}
      </div>

      {/* Coupon */}
      <div className="card" style={{
        padding: '24px 28px', textAlign: 'center', maxWidth: 440, margin: '0 auto',
        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
      }}>
        <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Try Premium Free for 15 Days</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Use code at checkout to unlock all features</p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px 24px', background: 'var(--bg-card)',
          border: '2px dashed rgba(124,58,237,0.35)', borderRadius: 10,
        }}>
          <span style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 900, color: '#A78BFA', letterSpacing: '0.15em' }}>
            TRIAL15
          </span>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((f, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                gap: 12, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textAlign: 'left' }}>{f.q}</span>
                {open === i
                  ? <Minus size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
                  : <Plus  size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
                }
              </button>
              {open === i && (
                <div className="fade-in" style={{
                  padding: '0 20px 16px', fontSize: 13, color: 'var(--text-3)',
                  lineHeight: 1.7, borderTop: '1px solid var(--border)',
                  paddingTop: 12,
                }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
