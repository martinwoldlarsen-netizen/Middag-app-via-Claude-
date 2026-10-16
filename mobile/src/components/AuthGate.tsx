import { usePathname } from 'expo-router';
import type { ReactNode } from 'react';

import { LoginScreen, NewPasswordScreen } from '@/components/LoginScreen';
import { useAuth } from '@/lib/auth';

// Som i ukepenger: du logger inn og får appen. Lenken fra samboer (/bli-med)
// virker før innlogging, så husstanden blir med når kontoen lages.
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, session, guest, recovery } = useAuth();
  const pathname = usePathname();
  if (!ready) return null;
  if (recovery) return <NewPasswordScreen />;
  if (session || guest || pathname.startsWith('/bli-med')) return <>{children}</>;
  return <LoginScreen />;
}
