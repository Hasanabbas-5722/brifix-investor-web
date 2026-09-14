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
    const isAuthPage = pathname === '/login' || pathname === '/signin' || pathname === '/register' || pathname === '/signup' || pathname === '/forgot-password';

    if (!token) {
      setIsAuthenticated(false);
      if (!isAuthPage) {
        router.replace('/signin');
      }
    } else {
      if (isTokenExpired(token)) {
        // Token is expired! Clean auth data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        dispatch(clearCredentials());
        setIsAuthenticated(false);
        if (!isAuthPage) {
          router.replace('/signin');
        }
      } else {
        setIsAuthenticated(true);
        if (isAuthPage) {
          router.replace('/');
        }
      }
    }
  }, [pathname, router, dispatch]);

  const isAuthPage = pathname === '/login' || pathname === '/signin' || pathname === '/register' || pathname === '/signup' || pathname === '/forgot-password';

  // If on a protected route and not authenticated, render loading screen while redirecting
  if (!isAuthPage && !isAuthenticated) {
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
        <main style={{ flex: 1 }} className="pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
