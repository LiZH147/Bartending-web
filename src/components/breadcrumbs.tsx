import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Visible breadcrumb trail. The page's BreadcrumbList JSON-LD is generated from
 * the same position data, so the structured data always matches what the user
 * (and a reviewer in Search Console) can actually see on the page.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-brand-cream">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-brand-cream">
                {item.label}
              </span>
            )}
            {index < items.length - 1 && <span aria-hidden="true">›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
