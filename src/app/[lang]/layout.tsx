import type { Metadata } from "next";
import { I18nProvider, type Locale } from "@/lib/i18n/I18nProvider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { LOCALE_META, SITE_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh-CN" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = lang === "zh-CN" ? "zh-CN" : "en";
  const meta = LOCALE_META[locale];
  return {
    title: { default: meta.title, template: `%s · ${SITE_NAME}` },
    description: meta.description,
    keywords: meta.keywords,
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
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = lang === "zh-CN" ? "zh-CN" : "en";

  return (
    <I18nProvider initialLocale={locale}>
      <a
        href="#main"
        className="sr-only z-[100] rounded-md bg-brand-amber px-4 py-2 text-sm font-medium text-brand-burgundy focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </div>
    </I18nProvider>
  );
}