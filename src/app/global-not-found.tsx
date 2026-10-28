import type { Metadata } from "next";
import Link from "next/link";

/**
 * Global 404 document.
 *
 * The root layout lives in app/[lang]/layout.tsx (so <html lang> can follow the
 * route), which means there is no layout at app/ to wrap a global not-found
 * boundary. Next renders this file instead, and it must therefore provide its
 * own <html>/<body>.
 */
export const metadata: Metadata = {
  title: "Page not found · NIGHTCAP",
  robots: { index: false, follow: false },
};

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#17120b",
    color: "#f3e8d3",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    padding: "48px 24px",
  } as const,
  card: { textAlign: "center" as const, maxWidth: 520 },
  code: { fontSize: 56, margin: 0, letterSpacing: 2 } as const,
  lead: { marginTop: 12, fontSize: 15, color: "#c9b794" } as const,
  links: { marginTop: 28, display: "flex", gap: 12, justifyContent: "center" } as const,
  link: {
    display: "inline-block",
    borderRadius: 999,
    border: "1px solid rgba(217,164,65,0.4)",
    background: "rgba(217,164,65,0.1)",
    color: "#d9a441",
    padding: "10px 20px",
    fontSize: 14,
    textDecoration: "none",
  } as const,
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={styles.body}>
        <div style={styles.card}>
          <p style={styles.code}>🍸 404</p>
          <p style={styles.lead} lang="en">
            This page does not exist. Try the classic cocktail index instead.
          </p>
          <p style={styles.lead} lang="zh-CN">
            这个页面不存在，可以从经典配方索引重新开始。
          </p>
          <div style={styles.links}>
            <Link href="/en/classics" style={styles.link}>
              All classics
            </Link>
            <Link href="/zh-CN/classics" style={styles.link}>
              全部经典配方
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
