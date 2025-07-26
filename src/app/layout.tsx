import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/contexts/theme-context';
import ClientLayout from '@/components/layout/client-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Sosmedin',
    description: 'A modern social media platform',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full">
            <head>
                <meta name="theme-color" content="#ffffff" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-theme`}>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Skip to main content
                </a>
                <ErrorBoundary>
                    <ThemeProvider>
                        <SessionProvider>
                            <ToastProvider>
                                <ErrorBoundary>
                                    <ClientLayout>
                                        <ErrorBoundary>
                                            {children}
                                        </ErrorBoundary>
                                    </ClientLayout>
                                </ErrorBoundary>
                            </ToastProvider>
                        </SessionProvider>
                    </ThemeProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}