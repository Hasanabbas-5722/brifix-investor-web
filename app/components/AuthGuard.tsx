'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearCredentials } from '@/lib/store/slices/authSlice';
import { isTokenExpired } from '@/lib/utils/auth';
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isAuthPage = pathname === '/login' || pathname === '/signin' || pathname === '/forgot-password';

    if (!token) {
      setIsAuthenticated(false);
      if (!isAuthPage) {
        router.push('/signin');
      }
    } else {
      if (isTokenExpired(token)) {
        // Token is expired! Clean auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        dispatch(clearCredentials());
        setIsAuthenticated(false);
        if (!isAuthPage) {
          router.push('/signin');
        }
      } else {
        setIsAuthenticated(true);
        if (isAuthPage) {
          router.push('/');
        }
      }
    }
  }, [pathname, router, dispatch]);

  // Don't render anything until we've checked auth state (prevents flash of dashboard)
  const isAuthPage = pathname === '/login' || pathname === '/signin' || pathname === '/forgot-password';

  if (isAuthenticated === null && !isAuthPage) {
    return (
      <div style={{ display: 'flex', height: '100dvh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <div className="app-shell">
        <TopBar />
        <main style={{ flex: 1, paddingBottom: "env(safe-area-inset-bottom)" }} className="pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
