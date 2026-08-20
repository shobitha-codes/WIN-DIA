"use client";

import { comboOffer } from "@/src/frontend/data/products";

import { ProductRange } from "./GlutenFree";

/** Combo offer displayed on the shop landing page. */
export function ComboOffer() {
  return (
    <ProductRange
      heading="The Combo Offer"
      headingId="combo-offer-heading"
      products={[comboOffer]}
      theme="combo"
    />
  );
}