import type { Metadata } from "next";

// LocalStorage-backed personal page — no search value, keep it out of the index
// (knowledge-base: thin/cookie pages dilute crawl budget).
export const metadata: Metadata = {
  title: "My Cabinet",
  robots: { index: false, follow: false },
};

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}