"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { isOutOfStock, toRouteId, type Product, type ProductTheme } from "./productShared";

import styles from "./ProductCard.module.scss";



type ProductCardProps = {
  readonly product: Product;
  readonly theme: ProductTheme;
  readonly quantity: number;
  readonly isWishlisted: boolean;
  readonly onQuantityChange: (quantity: number) => void;
  readonly onToggleWishlist: () => void;
  readonly unavailableFlavors?: readonly string[];
};



export function ProductCard({
  product,
  theme,
  isWishlisted,
  onToggleWishlist,
  unavailableFlavors,                       
}: ProductCardProps) {
  const href = `/product/${toRouteId(theme, product)}`;
  const outOfStock = isOutOfStock(product);

  // ← ADD THESE 3 LINES right below `const outOfStock = ...`
  const missingFlavors = unavailableFlavors ?? [];
  const hasMissingFlavor = !outOfStock && missingFlavors.length > 0;
  const missingLabel = missingFlavors.join(", ");

  const images = Array.isArray(product.image)
    ? product.image
    : [product.image];

  const [currentImage, setCurrentImage] = useState(0);

  const touchStartX = useRef<number | null>(null);

  const nextImage = (event?: React.MouseEvent) => {
    event?.stopPropagation();

    setCurrentImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  const previousImage = (event?: React.MouseEvent) => {
    event?.stopPropagation();

    setCurrentImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0].clientX;
    const difference = touchStartX.current - touchEndX;

    // Require a meaningful swipe
    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        nextImage();
      } else {
        previousImage();
      }
    }

    touchStartX.current = null;
  };


    const imageElement = (
    <Image
      className={styles.image}
      src={images[currentImage]}
      alt={`Windia Thins ${product.name}${
        images.length > 1 ? ` - Image ${currentImage + 1}` : ""
      }`}
      fill
      sizes={
        theme === "combo"
          ? "(max-width: 640px) 100vw, 560px"
          : "(max-width: 640px) 33.333vw, 33.333vw"
      }
      priority={currentImage === 0}
    />
  );

  return (
    <li
      className={`${styles.tile} ${outOfStock ? styles.outOfStock : ""}`}
      data-theme={theme}
    >
      <div className={styles.imageWrap}>
        <div
          className={styles.carousel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
                    {outOfStock ? (
            <div className={styles.imageLink}>{imageElement}</div>
          ) : (
            <Link className={styles.imageLink} href={href}>
              {imageElement}
            </Link>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.carouselButton} ${styles.previousButton}`}
                onClick={previousImage}
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                className={`${styles.carouselButton} ${styles.nextButton}`}
                onClick={nextImage}
                aria-label="Next image"
              >
                ›
              </button>

              <div className={styles.dots}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`${styles.dot} ${
                      index === currentImage ? styles.activeDot : ""
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentImage(index);
                    }}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {(outOfStock || product.offer) && (
            <span
              className={`${styles.offerBadge} ${
                outOfStock ? styles.outBadge : ""
              }`}
            >
              {outOfStock ? "Out of stock" : product.offer}
            </span>
          )}

                    {hasMissingFlavor && (
            <span className={styles.flavorBadge}>
              {missingLabel} out of stock
            </span>
          )}

          <button
            className={`${styles.wishlistButton} ${
              isWishlisted ? styles.wishlistActive : ""
            }`}
            type="button"
            disabled={outOfStock}
            aria-label={`${isWishlisted ? "Remove" : "Add"} ${
              product.name
            } ${isWishlisted ? "from" : "to"} wishlist`}
            onClick={onToggleWishlist}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>

                    {hasMissingFlavor && (
            <div className={styles.flavorNotice}>
              {missingLabel} back in stock soon
            </div>
          )}

                    {outOfStock && (
            <div className={styles.notifyButton}>Back in stock soon</div>
          )}


          



        </div>
      </div>
    </li>
  );
}