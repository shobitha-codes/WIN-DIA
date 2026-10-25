import type { MetadataRoute } from "next";

import { absoluteUrl, SITE_URL } from "@/src/frontend/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/auth/",
          "/profile",
          "/profile/",
          "/cart",
          "/checkout",
          "/order-confirmation",
          "/wishlist",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
