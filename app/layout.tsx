import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GlobalLeaves from '@/components/layout/GlobalLeaves';
import AudioPlayer from '@/components/ui/AudioPlayer';
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Google Fonts - 毛笔字体 + 衬线字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Liu+Jian+Mao+Cao&family=Ma+Shan+Zheng&family=Zhi+Mang+Xing&family=Long+Cang&family=Noto+Serif+SC:wght@400;700&family=Cinzel:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalLeaves />
          <AudioPlayer />
        </AuthProvider>
      </body>
    </html>
  );
}
