import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../components/providers/AuthProvider';
import { PWAProvider } from '../components/providers/PWAProvider';
import { OfflineProvider } from '../components/providers/OfflineProvider';
import { OfflineBanner } from '../components/ui/OfflineBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DzidzaAI - Indigenous Language Learning Platform',
  description: 'AI-powered educational platform supporting indigenous language learning in Zimbabwe',
  keywords: 'education, AI, Shona, Ndebele, Tonga, learning, Zimbabwe',
  authors: [{ name: 'DzidzaAI Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={inter.className}>
        <PWAProvider>
          <AuthProvider>
            <OfflineProvider>
              <OfflineBanner />
              <div className="min-h-screen bg-gray-50">
                {children}
              </div>
            </OfflineProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
