'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserDashboard } from '@/components/screens/UserDashboard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { displayLogin, isUsernameEmail } from '@/lib/username';

interface Viewer { name: string; email: string }

/** Signed-in dashboard. The middleware already sends signed-out visitors to /login. */
export default function UserHomePage() {
  const router = useRouter();
  const [viewer, setViewer] = useState<Viewer | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return router.replace('/login');
      const name = (u.user_metadata?.full_name as string | undefined)?.trim() || displayLogin(u.email).split('@')[0] || 'there';
      // Username accounts have only a placeholder address: never prefill forms with it.
      setViewer({ name, email: isUsernameEmail(u.email) ? '' : u.email ?? '' });
    }, () => router.replace('/login'));
  }, [router]);

  const onLogout = async () => {
    try {
      await getSupabaseBrowserClient().auth.signOut();
    } catch {
      /* signed out locally either way */
    }
    router.replace('/');
    router.refresh();
  };

  if (!viewer) {
    return (
      <div role="status" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF8', fontFamily: "'Geist', system-ui, sans-serif", color: '#8C8C8C', fontSize: '14px' }}>
        Loading…
      </div>
    );
  }

  return <UserDashboard userName={viewer.name} userEmail={viewer.email} onLogout={onLogout} defaultTab="home" />;
}
