"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

import { addToCart } from "@/src/frontend/redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/src/frontend/redux/slices/wishlistSlice";

import { ProductCard } from "./ProductCard";
import { findProductByRouteId, getRecommendations } from "./productLookup";
import { toStoreProduct, type Product, type ProductTheme } from "./productShared";

import styles from "./ProductDetail.module.scss";

type ProductDetailProps = {
  /** The route id from the URL, e.g. "everyday-oat-thins". */
  readonly routeId: string;
};

export function ProductDetail({ routeId }: ProductDetailProps) {
  const match = findProductByRouteId(routeId);

  if (!match) {
    return (
      <section className={styles.section}>
        <div className={styles.notFound}>
          <p className={styles.infoEyebrow}>Windia Thins</p>
          <h1 className={styles.infoName}>We couldn&apos;t find that product</h1>
          <p className={styles.description}>It may have been renamed or removed.</p>
          <Link className={styles.backLink} href="/">Back to shop</Link>
        </div>
      </section>
    );
  }

  return <ProductDetailContent product={match.product} theme={match.theme} routeId={routeId} />;
}

function ProductDetailContent({ product, theme, routeId }: { product: Product; theme: ProductTheme; routeId: string }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [quantity, setQuantityState] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [recQuantities, setRecQuantities] = useState<Record<string, number>>({});
  const [recWishlisted, setRecWishlisted] = useState<Record<string, boolean>>({});

  const setQuantity = (next: number) => {
    const nextQuantity = Math.max(0, next);
    if (nextQuantity > quantity) {
      dispatch(addToCart(toStoreProduct(product, theme), nextQuantity - quantity));
      toast.success("Added to cart");
    }
    setQuantityState(nextQuantity);
  };

  const toggleWishlist = () => {
    const next = !isWishlisted;
    const storeProduct = toStoreProduct(product, theme);
    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(removeFromWishlist(storeProduct.id));
      toast("Removed from wishlist");
    }
    setIsWishlisted(next);
  };

  const buyNow = () => {
    dispatch(addToCart(toStoreProduct(product, theme), 1));
    toast.success("Added to cart");
    router.push("/checkout");
  };

  const recommendations = getRecommendations(routeId, theme, 4);

  const setRecQuantity = (recRouteId: string, recProduct: Product, recTheme: ProductTheme, next: number) => {
    const nextQuantity = Math.max(0, next);
    const current = recQuantities[recRouteId] ?? 0;
    if (nextQuantity > current) {
      dispatch(addToCart(toStoreProduct(recProduct, recTheme), nextQuantity - current));
      toast.success("Added to cart");
    }
    setRecQuantities((q) => ({ ...q, [recRouteId]: nextQuantity }));
  };

  const toggleRecWishlist = (recRouteId: string, recProduct: Product, recTheme: ProductTheme) => {
    const next = !recWishlisted[recRouteId];
    const storeProduct = toStoreProduct(recProduct, recTheme);
    if (next) {
      dispatch(addToWishlist(storeProduct));
      toast.success("Saved to wishlist");
    } else {
      dispatch(removeFromWishlist(storeProduct.id));
      toast("Removed from wishlist");
    }
    setRecWishlisted((w) => ({ ...w, [recRouteId]: next }));
  };

  return (
    <section className={styles.section} data-navbar-theme={theme}>
      <div className={styles.detail}>
        <div className={styles.detailImage}>
          <Image src={product.image} alt={`Windia Thins ${product.name}`} fill sizes="(max-width: 768px) 100vw, 45vw" priority />
        </div>

        <div className={styles.detailContent}>
          <p className={styles.infoEyebrow}>{product.title}</p>
          <h1 className={styles.infoName}>{product.name}</h1>
          <p className={styles.flavour}>Flavour: {product.flavour}</p>

          {product.rating && (
            <p className={styles.ratingRow}>
              ★ {product.rating}
              {product.reviews && <span className={styles.reviewCount}> ({product.reviews} reviews)</span>}
            </p>
          )}

          <p className={styles.description}>{product.description}</p>
          <p className={styles.detailPrice}>{product.price}</p>
          {product.offerDetails && <p className={styles.offerDetails}>{product.offerDetails}</p>}
          {product.delivery && <p className={styles.delivery}>{product.delivery}</p>}

          {product.reviewList && product.reviewList.length > 0 && (
            <ul className={styles.reviewList}>
              {product.reviewList.map((review, i) => (
                <li key={i} className={styles.review}>{review}</li>
              ))}
            </ul>
          )}

          <div className={styles.detailActions}>
            <button
              className={`${styles.wishlistButton} ${isWishlisted ? styles.wishlistActive : ""}`}
              type="button"
              aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist`}
              onClick={toggleWishlist}
            >
              {isWishlisted ? "♥" : "♡"}
            </button>

            {quantity === 0 ? (
              <button className={styles.addToCartButton} type="button" onClick={() => setQuantity(1)}>
                Add to cart
              </button>
            ) : (
              <div className={styles.quantityControl}>
                <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => setQuantity(quantity - 1)}>−</button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label={`Add one ${product.name}`} onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            )}

            <button className={`${styles.addToCartButton} ${styles.buyNowButton}`} type="button" onClick={buyNow}>
              Buy now
            </button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className={styles.recommendations}>
          <h2 className={styles.recommendationsHeading}>You might also like</h2>
          <ul className={styles.recommendationsGrid}>
            {recommendations.map(({ product: recProduct, theme: recTheme, routeId: recRouteId }) => (
              <ProductCard
                key={recRouteId}
                product={recProduct}
                theme={recTheme}
                quantity={recQuantities[recRouteId] ?? 0}
                isWishlisted={!!recWishlisted[recRouteId]}
                onQuantityChange={(q) => setRecQuantity(recRouteId, recProduct, recTheme, q)}
                onToggleWishlist={() => toggleRecWishlist(recRouteId, recProduct, recTheme)}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
