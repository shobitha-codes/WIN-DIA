import type { Metadata } from "next";

import { ProductDetail } from "@/src/frontend/components/shop/products/ProductDetail";
import { JsonLd } from "@/src/frontend/components/Seo/JsonLd";
import { breadcrumbJsonLd } from "@/src/frontend/components/Seo/Breadcrumbs";
import {
  getProductSeo,
  pageMetadata,
  productImageUrl,
  productJsonLd,
} from "@/src/frontend/lib/seo";

type ProductPageProps = {
  readonly params: Promise<{ readonly id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const seo = getProductSeo(id);

  if (!seo) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    image: productImageUrl(seo.product),
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const seo = getProductSeo(id);

  return (
    <>
      {seo && (
        <>
          <JsonLd data={productJsonLd(seo)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: "Home", href: "/" },
              { name: "Shop", href: "/shop" },
              { name: seo.displayName },
            ])}
          />
        </>
      )}
      <ProductDetail routeId={id} />
    </>
  );
}
