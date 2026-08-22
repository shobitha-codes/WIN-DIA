"use client";

import Image from "next/image";
import Link from "next/link";

import { toRouteId, type Product, type ProductTheme } from "./productShared";

import styles from "./ProductCard.module.scss";

type ProductCardProps = {
  readonly product: Product;
  readonly theme: ProductTheme;
  readonly quantity: number;
  readonly isWishlisted: boolean;
  readonly onQuantityChange: (quantity: number) => void;
  readonly onToggleWishlist: () => void;
};

export function ProductCard({ product, theme, isWishlisted, onToggleWishlist }: ProductCardProps) {
  const href = `/product/${toRouteId(theme, product)}`;

  return (
    <li className={styles.tile}>
      <div className={styles.imageWrap}>
        <Link className={styles.imageLink} href={href}>
          <Image
            className={styles.image}
            src={product.image}
            alt={`Windia Thins ${product.name}`}
            fill
            sizes="(max-width: 768px) 50vw, 33.333vw"
          />
        </Link>
        {product.offer && <span className={styles.offerBadge}>{product.offer}</span>}
        <button
          className={`${styles.wishlistButton} ${isWishlisted ? styles.wishlistActive : ""}`}
          type="button"
          aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist`}
          onClick={onToggleWishlist}
        >
          {isWishlisted ? "♥" : "♡"}
        </button>
      </div>
    </li>
  );
}