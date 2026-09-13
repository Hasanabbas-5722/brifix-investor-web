'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, BarChart3, BrainCircuit, Briefcase, CreditCard, User, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/chart', label: 'Charts', Icon: BarChart3 },
  { href: '/predictions', label: 'AI Predict', Icon: BrainCircuit },
  { href: '/portfolio', label: 'Portfolio', Icon: Briefcase },
  { href: '/pricing', label: 'Pricing', Icon: CreditCard },
  { href: '/profile', label: 'Profile', Icon: User },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-w)',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }} className="hidden lg:flex">

      {/* Logo */}
      <Link href="/" title="Brifix" style={{
        width: '100%', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {/* <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366F1, #818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}> */}
        <Image
          src="/brifix-logo.png"
          alt="Brifix Logo"
          width={42}
          height={82}
          style={{ borderRadius: 8, objectFit: 'contain' }}
        />
        {/* </div> */}
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, overflowY: 'auto' }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <div key={href} style={{ position: 'relative' }} className="group">
              <Link href={href} title={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: 10,
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
                }}>
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, background: 'var(--accent)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              </Link>

              {/* Tooltip */}
              <span style={{
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
              }} className="group-hover:opacity-100">
                {label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Market status */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: '1px solid var(--border)', flexShrink: 0, width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Market Open">
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
        </div>
      </div>
    </aside>
  );
}
