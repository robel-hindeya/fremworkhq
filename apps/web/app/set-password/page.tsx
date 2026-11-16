import type { Metadata } from 'next';
import { SetPasswordScreen } from '@/components/screens/SetPasswordScreen';

export const metadata: Metadata = { title: 'Set your password', robots: { index: false } };

export default function SetPasswordPage() {
  return <SetPasswordScreen />;
}
