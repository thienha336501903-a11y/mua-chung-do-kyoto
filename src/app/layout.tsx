import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c3b2e',
};

export const metadata: Metadata = {
  title: 'Nhu cầu mua sắm cư dân Kyoto',
  description:
    'Cùng tổng hợp nhu cầu Tivi, Sofa, Rèm, Điện máy… để cộng đồng cư dân có cơ sở tìm mức giá mua chung tốt hơn.',
  applicationName: 'Kyoto Shopping Demand Survey',
  authors: [{ name: 'Cộng đồng Cư dân Kyoto' }],
  keywords: [
    'Kyoto',
    'Cư dân Kyoto',
    'Chung cư Kyoto',
    'Mua chung đồ',
    'Nhu cầu mua sắm',
    'Tivi',
    'Sofa',
    'Rèm',
    'Tủ lạnh',
    'Máy giặt',
  ],
  openGraph: {
    title: 'Nhu cầu mua sắm cư dân Kyoto',
    description:
      'Cùng tổng hợp nhu cầu Tivi, Sofa, Rèm, Điện máy… để cộng đồng cư dân có cơ sở tìm mức giá mua chung tốt hơn.',
    url: 'https://mua-chung-do-kyoto.vercel.app',
    siteName: 'Nhu cầu mua sắm cư dân Kyoto',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nhu cầu mua sắm cư dân Kyoto',
    description:
      'Cùng tổng hợp nhu cầu Tivi, Sofa, Rèm, Điện máy… để cộng đồng cư dân có cơ sở tìm mức giá mua chung tốt hơn.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`scroll-smooth ${inter.variable}`}>
      <body className="bg-stone-50 font-sans antialiased text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
