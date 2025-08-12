
import type {Metadata} from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { Libre_Baskerville } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Logi Track',
  description: 'Une application construite avec Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <div className={libreBaskerville.className}>
         <AppLayout>{children}</AppLayout>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
