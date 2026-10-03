import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "NIGHTCAP — What can I mix tonight?",
  description:
    "AI cocktail recommendation: tell us what's in your cabinet and we'll find what you can mix tonight.",
};

export const viewport: Viewport = {
  themeColor: "#17120b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </I18nProvider>
        <noscript>
          <style>{`body:before{content:"This app works best with JavaScript enabled.";display:block;padding:1rem;color:#c9b794}`}</style>
        </noscript>
      </body>
    </html>
  );
}