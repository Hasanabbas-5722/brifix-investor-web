'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, BrainCircuit, Briefcase, CreditCard } from 'lucide-react';

const TABS = [
  { href: '/',            label: 'Home',     Icon: LayoutDashboard },
  { href: '/chart',       label: 'Charts',   Icon: BarChart3 },
  { href: '/predictions', label: 'AI',       Icon: BrainCircuit },
  { href: '/portfolio',   label: 'Portfolio',Icon: Briefcase },
  { href: '/pricing',     label: 'Plans',    Icon: CreditCard },
];

export default function MobileNav() {
  const path = usePathname();

  return (
    <nav className="lg:hidden" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 64,
      background: 'rgba(15,21,32,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href;
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            color: active ? 'var(--accent-light)' : 'var(--text-3)',
            textDecoration: 'none', height: '100%',
            transition: 'color 0.15s',
          }}>
            <Icon size={21} strokeWidth={active ? 2.2 : 1.6} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
