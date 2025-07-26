import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/contexts/theme-context';
import ClientLayout from '@/components/layout/client-layout';

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
            </head>
            <body className={`${inter.className} h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-theme`}>
                <ThemeProvider>
                    <SessionProvider>
                        <ClientLayout>
                            {children}
                        </ClientLayout>
                    </SessionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}