import { comboOffer, everydayProducts, glutenFreeProducts } from "@/src/frontend/data/products";

import { toRouteId, type Product, type ProductTheme } from "./productShared";

// One "entry" pairs a product with the range it belongs to, plus the
// route id built from both (see toRouteId in productShared.ts).
type Entry = { readonly theme: ProductTheme; readonly product: Product; readonly routeId: string };

/**
 * Flattens all three product collections (gluten-free, everyday, combo)
 * into a single list of { theme, product, routeId } entries, so the rest
 * of this file can search/filter across all of them at once instead of
 * writing three separate lookups.
 */
function allEntries(): readonly Entry[] {
  const collections: { theme: ProductTheme; products: readonly Product[] }[] = [
    { theme: "gluten-free", products: glutenFreeProducts },
    { theme: "everyday", products: everydayProducts },
    // comboOffer is a single product, not an array, so wrap it in one.
    { theme: "combo", products: [comboOffer] },
  ];

  return collections.flatMap(({ theme, products }) =>
    products.map((product) => ({ theme, product, routeId: toRouteId(theme, product) }))
  );
}

/**
 * Finds a product (and which range it's from) by its /product/[id] route
 * id. Used by ProductDetail.tsx to turn the URL param into an actual
 * product. Returns null if nothing matches (shown as a "not found" state).
 */
export function findProductByRouteId(routeId: string): { product: Product; theme: ProductTheme } | null {
  const match = allEntries().find((entry) => entry.routeId === routeId);
  return match ? { product: match.product, theme: match.theme } : null;
}

/**
 * Picks a handful of OTHER products to show as "You might also like" on
 * the detail page. Strategy: same-range products first (e.g. more
 * everyday items if you're viewing an everyday product), then fills any
 * remaining slots from the rest of the shop. Always excludes the product
 * currently being viewed.
 */
export function getRecommendations(excludeRouteId: string, theme: ProductTheme, count = 4): readonly Entry[] {
  const others = allEntries().filter((entry) => entry.routeId !== excludeRouteId);
  const sameRange = others.filter((entry) => entry.theme === theme);
  const rest = others.filter((entry) => entry.theme !== theme);
  return [...sameRange, ...rest].slice(0, count);
}