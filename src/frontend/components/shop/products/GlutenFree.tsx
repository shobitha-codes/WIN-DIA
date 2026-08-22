"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

import { glutenFreeProducts } from "@/src/frontend/data/products";
import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";

import { ProductCard } from "./ProductCard";
import { toStoreProduct, type Product, type ProductTheme } from "./productShared";

import styles from "./GlutenFree.module.scss";

type ProductRangeProps = {
  readonly heading: string;
  readonly headingId: string;
  readonly products: readonly Product[];
  readonly theme: ProductTheme;
};

/**
 * Same public shape as before: ProductRange is shared by GlutenFree,
 * Everyday, and ComboOffer, each rendering their own <section> one after
 * another wherever your page already places them. No shared nav or filter
 * bar lives in here — that stays out of this component on purpose, so each
 * range keeps working as a standalone drop-in.
 *
 * Clicking a card now takes you to a full /product/[id] page (see
 * ProductDetail.tsx) instead of opening a modal.
 */
export function ProductRange({ heading, headingId, products, theme }: ProductRangeProps) {
  const dispatch = useDispatch();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map((p) => [p.id, 0]))
  );
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});

  const setQuantity = (product: Product, next: number) => {
    const nextQuantity = Math.max(0, next);
    const current = quantities[product.id] ?? 0;
    if (nextQuantity > current) {
      dispatch(addToCart(toStoreProduct(product, theme), nextQuantity - current));
      toast.success("Added to cart");
    }
    setQuantities((q) => ({ ...q, [product.id]: nextQuantity }));
  };

  const toggleWishlist = (product: Product) => {
    const next = !wishlisted[product.id];
    const storeProduct = toStoreProduct(product, theme);
    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(removeFromWishlist(storeProduct.id));
      toast("Removed from wishlist");
    }
    setWishlisted((w) => ({ ...w, [product.id]: next }));
  };

  return (
    <section className={styles.section} aria-labelledby={headingId} data-navbar-theme={theme}>
      <div className={styles.headingArea}>
        <h2 id={headingId} className={styles.heading}>{heading}</h2>
      </div>

      <ul className={styles.grid}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            theme={theme}
            quantity={quantities[product.id] ?? 0}
            isWishlisted={!!wishlisted[product.id]}
            onQuantityChange={(q) => setQuantity(product, q)}
            onToggleWishlist={() => toggleWishlist(product)}
          />
        ))}
      </ul>
    </section>
  );
}

/** Gluten-free product range — unchanged export, same data import as before. */
export function GlutenFree() {
  return <ProductRange heading="Health & Wellness" headingId="gluten-free-heading" products={glutenFreeProducts} theme="gluten-free" />;
}
