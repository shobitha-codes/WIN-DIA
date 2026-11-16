"use client";

import { comboOffer } from "@/src/frontend/data/products";

import { ProductRange } from "./GlutenFree";
import type { Product } from "./productShared";

type ComboOfferProps = {
  readonly flavorProducts?: readonly Product[];
};

/** Combo offer displayed on the shop landing page. */
export function ComboOffer({ flavorProducts }: ComboOfferProps) {
  return (
    <ProductRange
      heading="Assorted Combo Offer"
      headingId="combo-offer-heading"
      products={[comboOffer]}
      theme="combo"
      flavorProducts={flavorProducts}
    />
  );
}