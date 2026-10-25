import Link from "next/link";

import { absoluteUrl } from "@/src/frontend/lib/seo";

export type BreadcrumbItem = {
  readonly name: string;
  /** Omit the href on the final (current) item. */
  readonly href?: string;
};

export type BreadcrumbListData = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: ReadonlyArray<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
};

/** Builds BreadcrumbList JSON-LD from the same items shown on the page. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): BreadcrumbListData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

type BreadcrumbsProps = {
  readonly items: readonly BreadcrumbItem[];
};

/**
 * Visible breadcrumb trail used on product and listing pages.
 * Kept dependency-free so it can render on both server and client pages.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        maxWidth: "68rem",
        margin: "0 auto 1.25rem",
        padding: "0 0.25rem",
        fontSize: "0.8rem",
        letterSpacing: "0.02em",
        color: "#6b4a33",
      }}
    >
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.4rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.name}-${index}`}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  {item.name}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} style={{ opacity: isLast ? 0.75 : 1 }}>
                  {item.name}
                </span>
              )}

              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
