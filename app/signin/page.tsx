'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/store/slices/authSlice';
import { authService } from '@/lib/services/authService';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function Signin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      console.log("Login response data without sensitive information", res.data.data);
      console.log(new Date());
console.log(Date.now());
      const msg = res?.data?.data?.message || res?.data?.message || '';
      const isSuccess = res?.data?.status === 'success' || msg.toLowerCase().includes('success');
      const userData = res?.data?.data?.data?.[0] || res?.data?.data?.user || res?.data?.user || res?.data?.data;
      const accessToken = userData?.accessToken || res?.data?.accessToken;

      if (isSuccess && accessToken) {
        // Store in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData?.currentPlan || userData?.plan) {
          localStorage.setItem('brifix_user_plan', (userData.currentPlan || userData.plan).toLowerCase());
        }

        // Store in Redux
        dispatch(setCredentials({
          token: accessToken,
          user: userData,
        }));

        router.replace('/');
      } else {
        setError(msg || 'Login failed');
      }
    } catch (err: any) {
      console.error("Login response error", err);
      setError(
        err?.response?.data?.message || 
        err?.message || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, #111827 0%, #030712 100%)',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div className="card fade-up" style={{
        width: '100%',
        maxWidth: '440px',
        padding: 'clamp(24px, 5vw, 40px)',
        background: 'rgba(15, 21, 32, 0.7)',
        backdropFilter: 'blur(20px)',

        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        borderRadius: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '150px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent-light), transparent)',
          pointerEvents: 'none'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)',
            transform: 'rotate(-5deg)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(5deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg)'}
          >
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>B</span>
          </div>
          <h1 className="gradient-text" style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13.5px', fontWeight: 500 }}>
            Sign in to access your secure investor dashboard
          </p>
        </div>

        {error && (
          <div className="fade-in" style={{
            background: 'rgba(244,63,94,0.06)',
            color: 'var(--red)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            border: '1px solid rgba(244,63,94,0.15)'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="label" style={{ marginBottom: '8px', display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} />
              </div>
              <input
                type="text"
                className="input"
                placeholder="name@example.com or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: '44px',
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#fff',
                  transition: 'all 0.2s ease'
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: '44px',
                  paddingRight: '44px',
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#fff',
                  transition: 'all 0.2s ease'
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{
              marginTop: '10px',
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
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading ? (
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '22px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              style={{
                color: 'var(--accent-light)',
                fontWeight: 700,
                textDecoration: 'none',
                marginLeft: '4px',
              }}
            >
              Create an account
            </Link>
          </p>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Secure Infrastructure
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
            <ShieldCheck size={14} /> End-to-end encrypted connection
          </p>
        </div>
      </div>
    </div>
  );
}
