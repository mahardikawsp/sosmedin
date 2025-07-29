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
    // For server components, we can't access window.location
    // The middleware should handle the callback URL properly
    redirect(redirectTo);
  }

  return <>{children}</>;
}

export default ProtectedRoute;
