import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
    // Check if user is already logged in
    const session = await getServerSession(authOptions);

    // If logged in, redirect to dashboard/feed
    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl w-full">
                <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
                    <h1 className="mb-4 text-5xl font-bold text-blue-600 dark:text-blue-400">Sosmedin</h1>
                    <p className="mb-6 text-center text-xl text-gray-600 dark:text-gray-300">
                        A modern social media platform for connecting with friends and sharing your thoughts
                    </p>

                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <h3 className="text-lg font-semibold mb-2">Share Your Thoughts</h3>
                            <p className="text-gray-600 dark:text-gray-400">Post short updates and join conversations with friends and followers</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <h3 className="text-lg font-semibold mb-2">Connect with Others</h3>
                            <p className="text-gray-600 dark:text-gray-400">Follow interesting people and build your network</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <h3 className="text-lg font-semibold mb-2">Discover Content</h3>
                            <p className="text-gray-600 dark:text-gray-400">Explore trending topics and find new perspectives</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Link href="/register" className="rounded bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition-colors">
                            Sign Up
                        </Link>
                        <Link href="/login" className="rounded border border-blue-600 px-6 py-3 font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}