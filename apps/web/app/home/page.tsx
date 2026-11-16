'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDashboard } from '@/components/screens/UserDashboard';

export default function UserHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('fw_user');
        if (local) {
          const u = JSON.parse(local);
          if (u.signedIn || u.signedUp) {
            setUserName(u.name || u.email || 'User');
            document.cookie = 'fw_logged_in=1; path=/; max-age=2592000';
            setChecked(true);
            return;
          }
        }
      }
    } catch {}
    // If not logged in, redirect to login page
    router.replace('/login');
  }, [router]);

  const onLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fw_user');
        document.cookie = 'fw_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch {}
    router.replace('/');
  };

  if (!checked || !userName) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAFAF8',
          fontFamily: "'Geist', system-ui, sans-serif",
          color: '#8C8C8C',
          fontSize: '14px',
        }}
      >
        Loading...
      </div>
    );
  }

  return <UserDashboard userName={userName} onLogout={onLogout} defaultTab="home" />;
}
