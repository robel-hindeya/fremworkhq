import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Where every sign-in lands. Signed-in people go to their dashboard; everyone else logs in first. */
export default async function OpenAppPage() {
  const { data } = await (await getSupabaseServerClient()).auth.getUser();
  redirect(data.user ? '/home' : '/login?next=/open-app');
}
