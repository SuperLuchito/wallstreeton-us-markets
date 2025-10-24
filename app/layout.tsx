import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WallStreet.ON - US Markets Trading',
  description: 'Trade US stocks and commodities on-chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const buildTag = process.env.NEXT_PUBLIC_BUILD_TAG || 'dev';
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <footer className="fixed bottom-0 right-0 p-2 text-xs text-gray-400 bg-white/80">
          Build: {buildTag}
        </footer>
      </body>
    </html>
  );
}

