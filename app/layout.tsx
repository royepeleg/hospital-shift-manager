import type { Metadata } from 'next';
import { Heebo, Inter } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'מנהל משמרות משפחתי',
  description: 'לוח תורנויות ליד המיטה',
};

/**
 * Root layout — sets RTL direction and Hebrew language for the entire app.
 * Uses Heebo (best Hebrew UI font) with Inter as a Latin fallback.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
