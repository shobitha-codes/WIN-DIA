import { ProductDetail } from "@/src/frontend/components/shop/products/ProductDetail";

type ProductPageProps = {
  readonly params: { readonly id: string };
};

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductDetail routeId={params.id} />;
}
