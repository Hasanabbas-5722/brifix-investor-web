'use client';

import { Bell, Search, ChevronDown, Zap, Crown, Star } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationModal from './NotificationModal';
import { usePlan } from '@/lib/context/PlanContext';

export default function TopBar() {
  const { plan, isPro, isPremium } = usePlan();
  const [focused, setFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      height: 64, flexShrink: 0,
      background: 'rgba(15,21,32,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
    }}>

      {/* Mobile logo */}
      <Link href="/" className="lg:hidden" style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginRight: 4,
      }}>
        <Image
          src="/brifix-logo.png"
          alt="Brifix Logo"
          width={42}
          height={42}
          style={{ borderRadius: 8, objectFit: 'contain' }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Brifix</span>
      </Link>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-elevated)',
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 12, padding: '0 12px', height: 38,
          transition: 'border-color 0.15s',
        }}>
          <Search size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search stocks, indices, news…"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-1)', fontSize: 13, width: '100%',
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>

        {/* Live badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 20, padding: '3px 10px',
        }} className="hidden sm:flex">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>LIVE</span>
        </div>

        {/* Plan Badge */}
        <Link
          href="/pricing"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isPremium ? 'rgba(245,158,11,0.12)' : isPro ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : isPro ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 20, padding: '3px 9px',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          title="Click to view or upgrade your plan"
        >
          {isPremium ? (
            <Crown size={12} color="#F59E0B" />
          ) : isPro ? (
            <Zap size={12} color="var(--accent-light)" />
          ) : (
            <Star size={12} color="var(--text-3)" />
          )}
          <span style={{
            fontSize: 10, fontWeight: 800,
            color: isPremium ? '#F59E0B' : isPro ? 'var(--accent-light)' : 'var(--text-2)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {plan}
          </span>
        </Link>

        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: notifOpen ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              border: `1px solid ${notifOpen ? 'var(--accent)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              color: notifOpen ? 'var(--accent-light)' : 'var(--text-2)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.borderColor = 'var(--border)'; }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute', top: 8, right: 8,
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent)',
              border: '1.5px solid var(--bg-card)',
            }} />
          </button>

          <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 8px', borderRadius: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>B</span>
          </div>
          <div className="hidden md:block" style={{ textAlign: 'left', lineHeight: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>Brifix User</p>
            <p style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Premium</p>
          </div>
          <ChevronDown size={13} color="var(--text-3)" className="hidden md:block" />
        </button>
      </div>
    </header>
  );
}
