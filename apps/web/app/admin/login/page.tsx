import type { Metadata } from 'next';
import { AdminLoginScreen } from '@/components/screens/AdminLoginScreen';

export const metadata: Metadata = {
  title: 'Admin log in',
  robots: { index: false },
};

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
