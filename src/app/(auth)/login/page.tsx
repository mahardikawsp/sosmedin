'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string | null>(null);

    // Get error from URL if it exists
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'OAuthAccountNotLinked') {
            setError('This email is already associated with another account. Please sign in using your password.');
        } else if (errorParam) {
            setError(`Authentication error: ${errorParam}`);
        }
    }, [searchParams]);

    useEffect(() => {
        // If user is authenticated, redirect to dashboard or callbackUrl
        if (status === 'authenticated') {
            // Get the callbackUrl from the URL if it exists
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
            router.push(callbackUrl);
        }
    }, [status, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setDebugInfo(null);
        setIsLoading(true);

        try {
            // Get the callbackUrl from the URL if it exists
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            setDebugInfo(`Sign in result: ${JSON.stringify(result)}`);

            if (result?.error) {
                setError('Invalid email or password');
                setIsLoading(false);
                return;
            }

            // Force a refresh to update the session
            window.location.href = callbackUrl;
        } catch (error) {
            setError('An unexpected error occurred');
            console.error('Login error:', error);
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            // Get the callbackUrl from the URL if it exists
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

            await signIn('google', { callbackUrl });
        } catch (error) {
            setError('Failed to sign in with Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6">
                <div>
                    <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight">
                        Sign in to Sosmedin
                    </h1>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Or{' '}
                        <Link
                            href="/register"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                        <div className="flex">
                            <div className="text-sm text-red-700 dark:text-red-400">
                                {error}
                            </div>
                        </div>
                    </div>
                )}

                {debugInfo && (
                    <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
                        <div className="flex">
                            <div className="text-xs text-gray-700 dark:text-gray-400 overflow-auto">
                                {debugInfo}
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                placeholder="Email address"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-white dark:bg-gray-800 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                placeholder="Password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-70"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 48 48"
                                width="24px"
                                height="24px"
                                role="img"
                                aria-labelledby="googleLogoTitle"
                            >
                                <title id="googleLogoTitle">Google logo</title>
                                <path
                                    fill="#FFC107"
                                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                                <path
                                    fill="#FF3D00"
                                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                                />
                                <path
                                    fill="#4CAF50"
                                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                                />
                                <path
                                    fill="#1976D2"
                                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                                />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}