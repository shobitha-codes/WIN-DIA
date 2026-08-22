import type { StaticImageData } from "next/image";

/**
 * The shape of a single product, same fields your GlutenFree/Everyday/
 * ComboOffer data already used (title, name, flavour, image, description,
 * price, plus the optional offer/delivery/rating/review fields).
 * Every file that touches a product (cards, grid, detail page) imports
 * this one type so they can never drift out of sync with each other.
 */
export type Product = {
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly flavour: string;
  readonly image: StaticImageData;
  readonly description: string;
  readonly price: string;
  readonly offer?: string;
  readonly offerDetails?: string;
  readonly delivery?: string;
  readonly rating?: string;
  readonly reviews?: string;
  readonly reviewList?: readonly string[];
};

/** Which product range a product belongs to — used to tell products apart across collections. */
export type ProductTheme = "gluten-free" | "everyday" | "combo";

/**
 * Builds the id used in the product's URL and as its React key, e.g.
 * theme "everyday" + product.id "oat-thins" -> "everyday-oat-thins".
 * This is the SAME id used everywhere: card links, the /product/[id] page,
 * and cart/wishlist entries — so a product always resolves to one id.
 */
export function toRouteId(theme: ProductTheme, product: Pick<Product, "id">) {
  return `${theme}-${product.id}`;
}

/**
 * Converts a Product (your product data shape) into the shape the redux
 * cart/wishlist slices expect (id, _id, slug, name, category, flavor,
 * description, price as a number, image as a plain string, etc).
 * Called right before dispatch(addToCart(...)) or dispatch(addToWishlist(...)).
 */
export function toStoreProduct(product: Product, theme: ProductTheme) {
  const id = toRouteId(theme, product);
  return {
    id,
    _id: id,
    slug: id,
    name: product.name,
    category: theme,
    flavor: product.flavour,
    description: product.description,
    // price comes in as a display string like "₹249" — strip everything
    // that isn't a digit or a decimal point so redux gets a plain number.
    price: Number(product.price.replace(/[^0-9.]/g, "")),
    image: product.image.src,
    countInStock: 100,
    netWeight: 200,
  };
}