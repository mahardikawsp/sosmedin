'use client';

import { useSession } from '@/hooks/use-session';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCallbackUrl } from '@/lib/url-utils';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Client component that protects routes by requiring authentication
 * Redirects to login if user is not authenticated
 */
export function AuthGuard({
  children,
  fallback,
  redirectTo = '/login',
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      const callbackUrl = createCallbackUrl(window.location.pathname);
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Show fallback while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}

export default AuthGuard;
