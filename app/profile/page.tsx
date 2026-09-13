'use client';

import {
  User, Shield, CreditCard, Bell, Moon, Lock,
  HelpCircle, FileText, Settings, LogOut, Camera, Crown, ChevronRight,
} from 'lucide-react';

const sections = [
  {
    title: 'Account',
    items: [
      { label: 'Personal Information', Icon: User,       desc: 'View and edit your details',   badge: undefined as string | undefined },
      { label: 'KYC Verification',     Icon: Shield,     desc: 'Identity verification status', badge: 'Pending' },
      { label: 'Bank & Payment',       Icon: CreditCard, desc: 'Manage payment methods',       badge: undefined },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Notifications', Icon: Bell,  desc: 'Alerts and email settings',  badge: undefined },
      { label: 'Appearance',    Icon: Moon,  desc: 'Dark mode and UI themes',    badge: undefined },
      { label: 'Security',      Icon: Lock,  desc: 'Password and 2FA settings',  badge: undefined },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help Center',     Icon: HelpCircle, desc: 'FAQs and support tickets',  badge: undefined },
      { label: 'Terms & Privacy', Icon: FileText,   desc: 'Legal documents',            badge: undefined },
      { label: 'App Settings',    Icon: Settings,   desc: 'Cache and data management',  badge: undefined },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>

      {/* Avatar card */}
      <div className="card" style={{
        padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
      }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>B</span>
          </div>
          <button style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-elevated)', border: '2px solid var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
          }} aria-label="Change avatar">
            <Camera size={12} />
          </button>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Brifix User</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>investor@brifix.in</p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 20, padding: '4px 12px',
        }}>
          <Crown size={12} color="#F59E0B" />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Premium Plan
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { value: '₹1.2Cr', label: 'Portfolio',   color: 'var(--text-1)' },
          { value: '14.9%',  label: 'Returns',     color: 'var(--green)' },
          { value: '243',    label: 'Predictions', color: 'var(--text-1)' },
        ].map(s => (
          <div key={s.label} className="card card-hover" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <p className="nums" style={{ fontSize: 20, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</p>
            <p className="label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      {sections.map(sec => (
        <div key={sec.title}>
          <p className="label" style={{ marginBottom: 10, paddingLeft: 4 }}>{sec.title}</p>
          <div className="card" style={{ overflow: 'hidden' }}>
            {sec.items.map((item, i) => (
              <button key={item.label} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', background: 'transparent', border: 'none',
                borderBottom: i < sec.items.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <item.Icon size={16} color="var(--text-2)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</p>
                    {item.badge && <span className="badge-amber">{item.badge}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.desc}</p>
                </div>
                <ChevronRight size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <button className="card" style={{
        width: '100%', padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 13, fontWeight: 700, color: 'var(--red)',
        border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
        cursor: 'pointer', background: 'var(--bg-card)', transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-bg)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>
        <LogOut size={16} /> Sign Out
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', paddingBottom: 8 }}>Version 2.0.0</p>
    </div>
  );
}
