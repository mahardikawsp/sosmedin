import { useSession as useNextAuthSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook that extends Next Auth's useSession with additional functionality
 * @param options Configuration options
 * @returns Session data and status
 */
export function useSession({
    required = false,
    redirectTo = '/login',
    onUnauthenticated,
}: {
    required?: boolean;
    redirectTo?: string;
    onUnauthenticated?: () => void;
} = {}) {
    const { data: session, status, update } = useNextAuthSession();
    const router = useRouter();

    // More explicit authentication checks
    const isAuthenticated = status === 'authenticated' && !!session?.user?.id;
    const isLoading = status === 'loading';
    const isUnauthenticated = status === 'unauthenticated' || (!isLoading && !session);

    useEffect(() => {
        // If authentication is required and the user is not authenticated
        if (required && isUnauthenticated) {
            if (onUnauthenticated) {
                onUnauthenticated();
            } else if (redirectTo) {
                router.push(redirectTo);
            }
        }
    }, [required, isUnauthenticated, router, redirectTo, onUnauthenticated]);

    return {
        data: session,
        status,
        isAuthenticated,
        isLoading,
        isUnauthenticated,
        update,
    };
}

export default useSession;