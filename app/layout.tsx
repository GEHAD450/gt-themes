import type { Metadata } from 'next';
import './globals.css';
import { getProfile } from '@/lib/content';
import { absolute, SITE_URL } from '@/lib/site';
import { LocaleProvider } from './components/Shell';

const description = 'GT-THEMES: تطوير ثيمات سلة وزد، إنشاء ثيمات خاصة، وتجهيز المتاجر من الصفر حتى الانطلاق — مع شرح مصوّر لكل ثيم ودعم مباشر على واتساب.';

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: 'GT-THEMES — ثيمات سلة وزد وتجهيز المتاجر', template: '%s — GT-THEMES' },
  description,
  openGraph: {
    type: 'website',
    siteName: 'GT-THEMES',
    locale: 'ar_AR',
    title: 'GT-THEMES — ثيمات سلة وزد وتجهيز المتاجر',
    description,
    images: [{ url: absolute('/brand/og.png'), width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  // the owner's proof to Google Search Console that the site is hers (set from the control panel)
  verification: { google: getProfile().google_verification || undefined },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
