import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import "../globals.css";
import { I18nProvider, type Locale } from "@/lib/i18n/I18nProvider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  DEFAULT_KEYWORDS,
  LOCALE_META,
  SITE_NAME,
  SITE_URL,
  jsonLdHtml,
  websiteJsonLd,
} from "@/lib/seo";

/**
 * Root layout for the whole site.
 *
 * It lives inside the [lang] segment on purpose: <html lang> must match the
 * document, and with a layout above the segment there is no way to emit
 * lang="zh-CN" for /zh-CN pages (they would all claim to be English).
 * Every route lives under [lang] except metadata routes (sitemap, robots,
 * opengraph-image) and route handlers, which need no layout. "/" is a redirect
 * handled by middleware (src/middleware.ts).
 */
const LANGS = ["en", "zh-CN"] as const;

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh-CN" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  // Unknown language prefixes (e.g. /no-such-page matching this dynamic segment)
  // must 404 rather than quietly render the English home page.
  if (!LANGS.includes(lang as (typeof LANGS)[number])) notFound();
  const locale: Locale = lang === "zh-CN" ? "zh-CN" : "en";
  const meta = LOCALE_META[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: meta.title, template: `%s · ${SITE_NAME}` },
    description: meta.description,
    keywords: DEFAULT_KEYWORDS,
    applicationName: SITE_NAME,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#17120b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Unknown prefixes (e.g. /no-such-page) match this dynamic segment; without this
  // guard they would render the home page at an arbitrary URL (a soft 404 that
  // search engines can index as duplicate content).
  if (!LANGS.includes(lang as (typeof LANGS)[number])) notFound();
  const locale: Locale = lang === "zh-CN" ? "zh-CN" : "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider initialLocale={locale}>
          <a
            href="#main"
            className="sr-only z-[100] rounded-md bg-brand-amber px-4 py-2 text-sm font-medium text-brand-burgundy focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            {locale === "zh-CN" ? "跳到主要内容" : "Skip to content"}
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </div>
        </I18nProvider>
        <noscript>
          <style>{`body:before{content:"This app works best with JavaScript enabled.";display:block;padding:1rem;color:#c9b794}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteJsonLd()) }}
        />
        <Analytics />
      </body>
    </html>
  );
}