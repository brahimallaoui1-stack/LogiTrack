
import type {Metadata} from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { PT_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Logi Track',
  description: 'Une application construite avec Firebase Studio',
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
       <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#223B55" />
      </head>
      <body className="antialiased">
        <div className={ptSans.className}>
         <AppLayout>{children}</AppLayout>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
