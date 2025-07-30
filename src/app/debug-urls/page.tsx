'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fixCallbackUrl } from '@/lib/redirect-fix';

function DebugUrlsContent() {
    const searchParams = useSearchParams();
    const [urls, setUrls] = useState<any>({});

    useEffect(() => {
        const callbackUrl = searchParams.get('callbackUrl');
        const fixedCallbackUrl = callbackUrl ? fixCallbackUrl(callbackUrl) : null;

        setUrls({
            currentUrl: window.location.href,
            origin: window.location.origin,
            callbackUrl,
            fixedCallbackUrl,
            searchParams: Object.fromEntries(searchParams.entries())
        });
    }, [searchParams]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">URL Debug Information</h1>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(urls, null, 2)}
            </pre>

            <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Test Links</h2>
                <div className="space-y-2">
                    <a
                        href="/login?callbackUrl=http://localhost:3000/dashboard"
                        className="block text-blue-600 hover:underline"
                    >
                        Login with localhost callback
                    </a>
                    <a
                        href="/login?callbackUrl=https://avvhvzvndubd.ap-southeast-1.clawcloudrun.com/dashboard"
                        className="block text-blue-600 hover:underline"
                    >
                        Login with production callback
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function DebugUrlsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <DebugUrlsContent />
        </Suspense>
    );
}