'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register');
  }, [router]);

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
