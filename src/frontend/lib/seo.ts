import type { Metadata } from "next";

import {
  toRouteId,
  type Product,
  type ProductTheme,
} from "@/src/frontend/components/shop/products/productShared";
import { findProductByRouteId } from "@/src/frontend/components/shop/products/productLookup";
import { BundlePricing } from "@/src/backend/constants/bundle-pricing.constants";

/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL if needed. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://windiafoods.com"
).replace(/\/+$/, "");

export const SITE_NAME = "WIN-DIA Foods";

export const SITE_DESCRIPTION =
  "WIN-DIA FibreRich Thins are low-GI, high-fibre coconut flour snacks baked with no maida and no preservatives. Shop every flavour with free delivery across India.";

export const DEFAULT_OG_IMAGE = "/images/hero/hero-poster.jpeg";

/** Joins a path to the canonical origin without creating duplicate slashes. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetadataInput = {
  readonly title: string;
  readonly description: string;
  /** Root-relative canonical path, e.g. "/shop". */
  readonly path: string;
  /** Set for the homepage so the layout title template is not applied twice. */
  readonly absoluteTitle?: boolean;
  readonly image?: string;
  readonly noIndex?: boolean;
};

/**
 * Builds consistent per-page metadata (title, description, canonical, Open
 * Graph and Twitter cards) from a single source of truth.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataInput): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl(image) }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(image)],
    },
    ...(noIndex
      ? { robots: { index: false, follow: true } }
      : { robots: { index: true, follow: true } }),
  };
}

/** Returns the URL of the first product image. */
export function productImageUrl(product: Product): string {
  const image = Array.isArray(product.image) ? product.image[0] : product.image;

  if (typeof image === "string") return image;
  return image?.src ?? DEFAULT_OG_IMAGE;
}

export type ProductSeo = {
  readonly routeId: string;
  readonly theme: ProductTheme;
  readonly product: Product;
  readonly displayName: string;
  readonly path: string;
  readonly title: string;
  readonly description: string;
};

const BUNDLE_LABEL = `${BundlePricing.PACKETS_PER_BUNDLE} × ${BundlePricing.PACKET_WEIGHT_GRAMS}g bundle`;

/** Reads the bundle weight from product data, falling back to the shared config. */
function productWeightGrams(product: Product): number {
  const raw = product.netWeight;

  if (typeof raw === "number" && raw > 0) return raw;

  if (typeof raw === "string") {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return BundlePricing.BUNDLE_WEIGHT_GRAMS;
}

/** Resolves a /product/[id] route to the data needed for metadata and schema. */
export function getProductSeo(routeId: string): ProductSeo | null {
  const match = findProductByRouteId(routeId);
  if (!match) return null;

  const { product, theme } = match;
  const isAssorted = product.flavour.toLowerCase() === "assorted";
  const displayName = isAssorted
    ? product.name
    : `${product.flavour} FibreRich Thins`;

  const title = isAssorted
    ? "Assorted Combo FibreRich Thins"
    : `${product.flavour} FibreRich Thins`;

  const description = isAssorted
    ? `${product.description} Pick any mix of Garlic, Jeera, Onion and Curry Leaves in a ${BUNDLE_LABEL}. Free delivery across India.`
    : `${product.description} ${product.offer ?? BUNDLE_LABEL} of low-GI, high-fibre WIN-DIA FibreRich Thins. Free delivery across India.`;

  return {
    routeId,
    theme,
    product,
    displayName,
    path: `/product/${routeId}`,
    title,
    description,
  };
}

export function productRouteId(product: Product, theme: ProductTheme): string {
  return toRouteId(theme, product);
}

/** Product schema based only on data shown on the product page. */
export function productJsonLd(seo: ProductSeo): Record<string, unknown> {
  const { product, displayName, path } = seo;
  const numericPrice = Number(product.price.replace(/[^0-9.]/g, ""));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayName,
    description: product.description,
    image: [absoluteUrl(productImageUrl(product))],
    sku: seo.routeId,
    category: "Healthy Snacks",
    brand: { "@type": "Brand", name: "WIN-DIA" },
    weight: {
      "@type": "QuantitativeValue",
      value: productWeightGrams(product),
      unitCode: "GRM",
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      priceCurrency: "INR",
      price: numericPrice.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}
