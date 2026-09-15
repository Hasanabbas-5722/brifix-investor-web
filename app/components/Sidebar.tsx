'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, BarChart3, BrainCircuit, Star, Briefcase, CreditCard, User, TrendingUp, X, Cpu } from 'lucide-react';
import { usePlan } from '@/lib/context/PlanContext';
import { useSidebar } from '@/lib/context/SidebarContext';

const NAV = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/chart', label: 'Charts', Icon: BarChart3 },
  { href: '/predictions', label: 'AI Predict', Icon: BrainCircuit },
  { href: '/autotrade', label: 'Auto Trade', Icon: Cpu },
  { href: '/watchlist', label: 'Watchlist', Icon: Star },
  { href: '/portfolio', label: 'Portfolio', Icon: Briefcase },
  { href: '/pricing', label: 'Pricing', Icon: CreditCard },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function Sidebar() {
  const path = usePathname();
  const { plan, isFree, isPro, isPremium } = usePlan();
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* ── 1. Desktop Fixed Sidebar (lg and above only) ── */}
      <aside className="desktop-sidebar">
        {/* Logo */}
        <Link
          href="/"
          title="Brifix"
          style={{
            width: '100%',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <Image
            src="/brifix-logo.png"
            alt="Brifix Logo"
            width={40}
            height={40}
            style={{ borderRadius: 8, objectFit: 'contain', width: 'auto', height: 'auto' }}
            priority
          />
        </Link>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, overflowY: 'auto' }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <div key={href} style={{ position: 'relative' }} className="group">
                <Link
                  href={href}
                  title={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    color: active ? 'var(--accent-light)' : 'var(--text-3)',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-1)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-3)';
                    }
                  }}
                >
                  {active && (
                    <span style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 20, background: 'var(--accent)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {href === '/predictions' && isFree && (
                    <span style={{
                      position: 'absolute', top: 3, right: 3,
                      fontSize: 8, fontWeight: 900, background: 'var(--accent)',
                      color: '#fff', padding: '1px 3px', borderRadius: 4,
                      letterSpacing: '0.04em', lineHeight: 1,
                    }}>
                      PRO
                    </span>
                  )}
                </Link>

                {/* Tooltip */}
                <span
                  style={{
                    position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                    marginLeft: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)',
                    fontSize: 12, fontWeight: 600,
                    padding: '5px 10px', borderRadius: 8,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    zIndex: 100,
                  }}
                  className="group-hover:opacity-100"
                >
                  {label}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Market status dot */}
        <div style={{
          height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid var(--border)', flexShrink: 0, width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Market Active">
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </aside>

      {/* ── 2. Mobile Slide-in Drawer Sidebar (opened by 3-line hamburger) ── */}
      {isOpen && (
        <div className="lg:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={closeSidebar}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />

          {/* Drawer Menu Panel */}
          <div
            className="fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              maxWidth: '82vw',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
              boxShadow: '0 0 50px rgba(0,0,0,0.85)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header: Logo, Title & Close Button */}
            <div style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 18px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <Link
                href="/"
                onClick={closeSidebar}
                style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
              >
                <Image
                  src="/brifix-logo.png"
                  alt="Brifix Logo"
                  width={34}
                  height={34}
                  style={{ borderRadius: 8, objectFit: 'contain', width: 'auto', height: 'auto' }}
                />
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)' }}>Brifix</span>
              </Link>

              <button
                type="button"
                onClick={closeSidebar}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation links with icons & labels */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {NAV.map(({ href, label, Icon }) => {
                const active = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSidebar}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      borderRadius: 12,
                      background: active ? 'var(--accent-dim)' : 'transparent',
                      color: active ? 'var(--accent-light)' : 'var(--text-2)',
                      textDecoration: 'none',
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  >
                    <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {href === '/predictions' && isFree && (
                      <span style={{
                        fontSize: 9, fontWeight: 900, background: 'var(--accent)',
                        color: '#fff', padding: '2px 5px', borderRadius: 4,
                        letterSpacing: '0.04em', lineHeight: 1,
                      }}>
                        PRO
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer with Plan Info */}
            <div style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Current Plan
                </p>
                <p style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isPremium ? 'var(--amber)' : isPro ? 'var(--accent-light)' : 'var(--text-1)',
                  textTransform: 'capitalize',
                  margin: 0,
                }}>
                  {plan} Tier
                </p>
              </div>
              <Link
                href="/pricing"
                onClick={closeSidebar}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent-light)',
                  background: 'var(--accent-dim)',
                  padding: '5px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
