import type { MetadataRoute } from "next";

import { getAllProductEntries } from "@/src/frontend/components/shop/products/productLookup";
import { absoluteUrl } from "@/src/frontend/lib/seo";

const STATIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/health-benefits", changeFrequency: "monthly", priority: 0.8 },
  { path: "/our-story/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/Recipes", changeFrequency: "monthly", priority: 0.7 },
  { path: "/our-story/contact", changeFrequency: "yearly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productPages: MetadataRoute.Sitemap = getAllProductEntries().map((entry) => ({
    url: absoluteUrl(`/product/${entry.routeId}`),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
