import { everydayProducts } from "@/src/frontend/data/products";

import { ProductRange } from "./GlutenFree";
import type { Product } from "./productShared";

type EverydayProps = {
  readonly products?: readonly Product[];
};

/** Everyday product range displayed on the shop landing page. Accepts an optional products override, falls back to the default list. */
export function Everyday({ products }: EverydayProps) {
  return (
    <ProductRange
      heading="The Everyday Range"
      headingId="everyday-heading"
      products={products ?? everydayProducts}
      theme="everyday"
    />
  );
}