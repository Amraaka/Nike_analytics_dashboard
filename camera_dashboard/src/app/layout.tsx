import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Camera Dashboard - Teller Activity Monitor',
  description: 'Bank hall teller activity and analytics dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
