import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider } from './components/Shell';

export const metadata: Metadata = {
  title: { default: 'GT-THEMES — ثيمات سلة وزد وشروحها', template: '%s — GT-THEMES' },
  description: 'ثيمات جاهزة لمتاجر سلة وزد مع شرح مصوّر لكل قسم وطريقة إعداده، ودعم مباشر على واتساب.',
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
