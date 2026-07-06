import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Krishi AI Agent - Smart Agriculture Platform',
  description: 'AI-powered crop disease detection, weather alerts, real-time mandi prices, agricultural chatbot (text & voice), and government schemes tracking for smart farming.',
  keywords: 'agriculture, AI, crop disease, mandi prices, weather alerts, farming chatbot, PM-KISAN, crop health, smart farming',
  authors: [{ name: 'Krishi AI Team' }]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon / SEO tags */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
