import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'Lumina Store | Premium Essentials',
    template: '%s | Lumina',
  },
  description:
    'Shop premium quality essentials at Lumina — fashion, electronics, home décor and more. Free shipping on orders over $100.',
  openGraph: {
    type: 'website',
    siteName: 'Lumina Store',
    title: 'Lumina Store | Premium Essentials',
    description:
      'Shop premium quality essentials at Lumina — fashion, electronics, home décor and more.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumina Store',
    description: 'Premium quality essentials designed for everyday living.',
  },
  robots: { index: true, follow: true },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex flex-col min-h-screen bg-background text-text-primary">
        <Providers>
          <Header />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
          <ChatbotWidget />
        </Providers>
      </body>
    </html>
  );
}
