import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Free motion templates by BuildMotions', description: 'Three free animated templates from buildmotions.com: Larkspur, Ledgerline and Polar Veil.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
