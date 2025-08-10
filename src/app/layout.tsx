
import type {Metadata} from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { PT_Sans } from 'next/font/google';

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
      <body className={`${ptSans.className} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
