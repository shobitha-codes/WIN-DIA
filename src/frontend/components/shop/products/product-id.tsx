import { useRouter } from "next/router";

import { ProductDetail } from "@/src/frontend/components/shop/products/ProductDetail";

export default function ProductPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  if (!id) return null;
  return <ProductDetail routeId={id} />;
}
