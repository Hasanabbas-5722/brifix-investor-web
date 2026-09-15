'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/store/slices/authSlice';
import { authService } from '@/lib/services/authService';
import {
  Mail,
  Lock,
  User,
  AtSign,
  Phone,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  Zap,
  Star,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

const PLAN_OPTIONS = [
  {
    id: 'Free',
    name: 'Free',
    badge: 'Starter',
    icon: Star,
    color: '#94A3B8',
    desc: 'Basic market data & 1 watchlist',
    price: '₹0',
  },
  {
    id: 'Pro',
    name: 'Pro',
    badge: 'Popular',
    icon: Zap,
    color: 'var(--accent-light)',
    desc: 'Real-time quotes & 50 AI picks/day',
    price: '₹499/mo',
  },
  {
    id: 'Premium',
    name: 'Premium',
    badge: 'VIP',
    icon: Crown,
    color: '#F59E0B',
    desc: 'Unlimited AI picks, options & VIP support',
    price: '₹999/mo',
  },
];

export default function Register() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro' | 'Premium'>('Free');
  const [tradingExperience, setTradingExperience] = useState('Beginner');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !fullName || !username || !mobile) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const cleanMobile = mobile.replace(/[^0-9+]/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register({
        name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: cleanMobile,
        mobile: cleanMobile,
        password,
        currentPlan: selectedPlan,
        plan: selectedPlan.toLowerCase(),
        tradingExperience,
      });

      const msg = res?.data?.data?.message || res?.data?.message || '';
      const isSuccess = res?.data?.status === 'success' || msg.toLowerCase().includes('success');
      const userData = res?.data?.data?.data?.[0] || res?.data?.data?.user || res?.data?.user || res?.data?.data;
      const accessToken = userData?.accessToken || res?.data?.accessToken;

      if (isSuccess && accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('brifix_user_plan', (selectedPlan || 'free').toLowerCase());

        dispatch(
          setCredentials({
            token: accessToken,
            user: userData,
          })
        );

        router.replace('/');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const serverMsg =
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please check your details.';
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, #111827 0%, #030712 100%)',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '10%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card fade-up"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: 'clamp(20px, 5vw, 36px)',
          background: 'rgba(15, 21, 32, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          borderRadius: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Glow accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent-light), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)',
              transform: 'rotate(-5deg)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(5deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(-5deg)')}
          >
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>B</span>
          </div>
          <h1
            className="gradient-text"
            style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}
          >
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 500 }}>
            Join thousands of traders using Brifix AI insights & real-time charts
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="fade-in"
            style={{
              background: 'rgba(244,63,94,0.08)',
              color: 'var(--red)',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              border: '1px solid rgba(244,63,94,0.2)',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Two-column grid for Name & Username (stacks on mobile) */}
          <div className="form-grid-2">
            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <User size={15} />
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Username *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <AtSign size={15} />
                </div>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  style={{
                    paddingLeft: '38px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Two-column grid for Email & Mobile (stacks on mobile) */}
          <div className="form-grid-2">
            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  className="input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Mobile Number *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Phone size={15} />
                </div>
                <input
                  type="tel"
                  className="input"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Passwords grid (stacks on mobile) */}
          <div className="form-grid-2">
            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '36px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="label"
                style={{
                  marginBottom: '6px',
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '36px',
                    background: 'rgba(255,255,255,0.02)',
                    borderColor:
                      confirmPassword && confirmPassword !== password
                        ? 'var(--red)'
                        : 'rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#fff',
                    height: '42px',
                  }}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Plan Selector Pill Cards */}
          <div>
            <label
              className="label"
              style={{
                marginBottom: '8px',
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Choose Initial Plan
            </label>
            <div className="plan-grid-3">
              {PLAN_OPTIONS.map((p) => {
                const isSelected = selectedPlan === p.id;
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 10px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#fff' : 'var(--text-1)' }}>
                        {p.name}
                      </span>
                      <IconComponent size={14} color={p.color} />
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: p.color, marginBottom: 2 }}>{p.price}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', lineHeight: 1.3 }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trading Experience Selector */}
          <div>
            <label
              className="label"
              style={{
                marginBottom: '6px',
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Trading Experience
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setTradingExperience(lvl)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: tradingExperience === lvl ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tradingExperience === lvl ? 'var(--accent-light)' : 'rgba(255,255,255,0.08)'}`,
                    color: tradingExperience === lvl ? '#fff' : 'var(--text-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{
              marginTop: '12px',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
              border: 'none',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Already have an account?{' '}
            <Link
              href="/signin"
              style={{
                color: 'var(--accent-light)',
                fontWeight: 700,
                textDecoration: 'none',
                marginLeft: '4px',
              }}
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer Security Badge */}
        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <p
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--green)',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} /> 256-Bit SSL Encrypted & Protected
          </p>
        </div>
      </div>
    </div>
  );
}
