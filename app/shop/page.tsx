import type { Metadata } from "next";

import { Hero } from "@/src/frontend/components/shop/Hero/Hero";
import { GlutenFree } from "@/src/frontend/components/shop/products/GlutenFree";
import { ComboOffer } from "@/src/frontend/components/shop/products/ComboOffer";
import { JsonLd } from "@/src/frontend/components/Seo/JsonLd";
import { breadcrumbJsonLd } from "@/src/frontend/components/Seo/Breadcrumbs";
import type { Product } from "@/src/frontend/components/shop/products/productShared";
import { BundlePricing } from "@/src/frontend/lib/pricing";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop Low-GI FibreRich Thins",
  description:
    "Shop WIN-DIA FibreRich Thins in Jeera, Garlic, Onion and Curry Leaves flavours, plus the assorted 6-packet combo. High-fibre, low-GI coconut flour snacks with free delivery across India.",
  path: "/shop",
});

/**
 * Fetches all active products from the internal API.
 * Returns an empty array on failure (components will fall back to static data).
 */
async function fetchAllProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 60, tags: ["products"] },
    });

    if (!res.ok) return [];

    const data = await res.json();

    // Handle both paginated { items: [...] } and direct array responses
    const products = data?.data?.items ?? data?.data ?? data?.products ?? [];
    if (!Array.isArray(products) || products.length === 0) return [];

    // Map Supabase product shape to the frontend Product shape expected by ProductRange
    // Filter out combo products (they're shown separately in ComboOffer component)
    return products
      .filter((p: Record<string, unknown>) => {
        const slug = String(p.slug ?? p.id ?? "").toLowerCase();
        const flavor = String(p.flavor ?? "").toLowerCase();
        return !slug.includes("combo") && !slug.includes("assorted") && flavor !== "assorted";
      })
      .map((p: Record<string, unknown>) => {
        // Map flavor to the correct product ID that matches static data
        const flavor = String(p.flavor ?? "").toLowerCase();
        let productId = "";
        
        // Map database flavor names to static product IDs
        if (flavor === "jeera" || flavor.includes("jeera") || flavor.includes("cumin")) {
          productId = "jeera";
        } else if (flavor === "garlic" || flavor.includes("garlic")) {
          productId = "garlic";
        } else if (flavor === "onion" || flavor.includes("onion")) {
          productId = "onion";
        } else if (flavor.includes("curry") || flavor.includes("leaf")) {
          productId = "curry-leaf";
        } else {
          // Fallback: extract from slug or use flavor
          const slug = String(p.slug ?? "").toLowerCase();
          productId = slug.replace(/^(gluten-free|everyday|combo)-/, "") || flavor;
        }
        
        // Parse net_weight from database (e.g., "240g" → 240)
        const parseNetWeight = (raw: unknown): number => {
          if (typeof raw === "string") {
            const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10);
            return !isNaN(parsed) && parsed > 0 ? parsed : BundlePricing.BUNDLE_WEIGHT_GRAMS;
          }
          if (typeof raw === "number") {
            return raw > 0 ? raw : BundlePricing.BUNDLE_WEIGHT_GRAMS;
          }
          return BundlePricing.BUNDLE_WEIGHT_GRAMS;
        };

        return {
          id: productId, // This must match the static product IDs
          dbId: String(p.id ?? ""),
          title: "WIN-DIA FibreRich Thins",
          name: `${String(p.flavor ?? "")} Flavour`,
          flavour: String(p.flavor ?? ""),
          image: String(p.image ?? p.image_url ?? ""),
          description: String(p.description ?? ""),
          price: `₹${Number(p.price ?? BundlePricing.BUNDLE_PRICE)}`,
          offer: `${BundlePricing.PACKETS_PER_BUNDLE} × ${BundlePricing.PACKET_WEIGHT_GRAMS}g Bundle`,
          offerDetails: "",
          delivery: "🚚 Free Delivery",
          netWeight: parseNetWeight(p.net_weight),
        };
      });
  } catch {
    return [];
  }
}

export default async function ShopPage() {
  const products = await fetchAllProducts();

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Shop FibreRich Thins", href: "/shop" },
        ])}
      />
      <Hero />
      <ComboOffer />
      <GlutenFree products={products.length ? products : undefined} />
    </main>
  );
}
