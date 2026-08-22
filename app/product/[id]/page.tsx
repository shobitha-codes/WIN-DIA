import { ProductDetail } from "@/src/frontend/components/shop/products/ProductDetail";

type ProductPageProps = {
  readonly params: Promise<{ readonly id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductDetail routeId={id} />;
}