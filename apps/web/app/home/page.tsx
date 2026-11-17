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
    let mounted = true;

    const setFromUser = (u: any) => {
      if (!mounted) return;
      if (!u) {
        // Also check localStorage fallback
        try {
          const local = localStorage.getItem('fw_user');
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed.email) {
              setViewer({ name: parsed.name || parsed.email.split('@')[0], email: parsed.email });
              return;
            }
          }
        } catch {}
        router.replace('/login');
        return;
      }
      const name = (u.user_metadata?.full_name as string | undefined)?.trim() || displayLogin(u.email).split('@')[0] || 'there';
      setViewer({ name, email: isUsernameEmail(u.email) ? '' : u.email ?? '' });
    };

    supabase.auth.getUser().then(({ data }) => {
      setFromUser(data?.user);
    }, () => setFromUser(null));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setFromUser(session.user);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
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
