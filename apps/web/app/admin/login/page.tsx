import type { Metadata } from 'next';
import { AdminLoginScreen } from '@/components/screens/AdminLoginScreen';

export const metadata: Metadata = {
  title: 'Admin Login · Fremwork',
  description: 'Authorized administrator portal login',
};

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
