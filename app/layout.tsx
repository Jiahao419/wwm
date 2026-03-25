import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GlobalLeaves from '@/components/layout/GlobalLeaves';
import AuthProvider from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: '月冕总坛 · YUEMIAN',
  description: '《燕云十六声》百业综合公会 — 月冕总坛官方网站',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalLeaves />
        </AuthProvider>
      </body>
    </html>
  );
}
