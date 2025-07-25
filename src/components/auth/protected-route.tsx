import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Server component that protects routes by requiring authentication
 * Redirects to login if user is not authenticated
 */
export async function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const session = await getSession();

  if (!session?.user) {
    const callbackUrl = typeof window !== 'undefined' ? window.location.href : '';
    const redirectPath = `${redirectTo}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    redirect(redirectPath);
  }

  return <>{children}</>;
}

export default ProtectedRoute;
