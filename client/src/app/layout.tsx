import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

export const metadata: Metadata = {
  title: {
    template: '%s | Lumina Store',
    default: 'Lumina Store | Premium Essentials',
  },
  description: "Premium quality essentials designed for everyday living.",
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
