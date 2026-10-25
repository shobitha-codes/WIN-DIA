"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { setCart } from "@/src/frontend/redux/slices/cartSlice";
import { BundlePricing } from "@/src/frontend/lib/pricing";
import { useAuth } from "./useAuth";

// Combo lines carry a flavour selection that the backend cart (product_id +
// quantity only) cannot represent. They live in Redux/localStorage and are
// sent with the order at checkout, so they are never pushed to / pulled from
// the backend cart. Everything else syncs normally.
const isComboLine = (item) => Boolean(item?.flavorSelections);
const productIdOf = (item) => item?._id || item?.id;
const COMBO_NAME = /combo|assorted/i;

/**
 * Syncs the frontend Redux cart with the backend Supabase cart.
 *
 * On login: Fetches cart from backend API and merges it with the local cart.
 * On cart change: Pushes add/remove/update to backend in background.
 *
 * The backend cart stores only product_id + quantity. Product details
 * (name, price, image) are fetched from /api/products when hydrating.
 */
export function useCartSync() {
  const dispatch = useDispatch();
  const store = useStore();
  const { user, token, loading } = useAuth();
  const cartItems = useSelector((s) => s.cart.cartItems);
  const cartIdRef = useRef(null);
  const syncedRef = useRef(false);
  const inFlightRef = useRef(false);
  const prevCartRef = useRef([]);

  const authFetch = useCallback((url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [token]);

  // Fetch cart from backend when user logs in
  useEffect(() => {
    if (loading || !user || !token) {
      syncedRef.current = false;
      inFlightRef.current = false;
      cartIdRef.current = null;
      prevCartRef.current = [];
      return;
    }
    if (syncedRef.current || inFlightRef.current) return;
    inFlightRef.current = true;

    async function fetchBackendCart() {
      try {
        const res = await authFetch("/api/cart");
        const data = await res.json();

        if (!data.success || !data.data) return;

        const { cart, items } = data.data;
        if (!cart) return;
        cartIdRef.current = cart.id;

        // Read the CURRENT cart (not the render-time snapshot): the
        // localStorage hydration / guest-cart merge may have run since.
        const localItems = store.getState().cart.cartItems;
        const localCombos = localItems.filter(isComboLine);
        const localPlain = localItems.filter((i) => !isComboLine(i));

        const enriched = items && items.length > 0 ? await enrichCartItems(items) : [];

        // A bare combo product in the backend cart has no flavour selection
        // and cannot be fulfilled — it is a leftover of the old sync, so drop it.
        const staleCombos = enriched.filter((i) => i.isComboProduct);
        const backendPlain = enriched.filter((i) => !i.isComboProduct);
        for (const stale of staleCombos) {
          authFetch(`/api/cart?cartId=${cart.id}&productId=${stale.id}`, { method: "DELETE" }).catch(() => {});
        }

        const backendMap = new Map(backendPlain.map((i) => [i.id, i]));
        const localMap = new Map(localPlain.map((i) => [productIdOf(i), i]));

        // Backend items: keep the larger quantity (idempotent across reloads,
        // and doesn't lose items a guest added before logging in).
        const mergedPlain = backendPlain.map((b) => {
          const local = localMap.get(b.id);
          if (local && local.qty > b.qty) {
            authFetch("/api/cart", {
              method: "PUT",
              body: JSON.stringify({ cart_id: cart.id, product_id: b.id, quantity: local.qty }),
            }).catch(() => {});
            return { ...b, qty: local.qty };
          }
          return b;
        });

        // Local-only items go up to the backend
        const localOnly = localPlain.filter((i) => !backendMap.has(productIdOf(i)));
        for (const item of localOnly) {
          await authFetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({
              cart_id: cart.id,
              product_id: productIdOf(item),
              quantity: item.qty || 1,
            }),
          }).catch(() => {});
        }

        const merged = [...mergedPlain, ...localOnly, ...localCombos];
        // Items the shopper added while this request was running
        const latest = store.getState().cart.cartItems;
        const seen = new Set(merged.map((i) => i.cartId || productIdOf(i)));
        const addedMeanwhile = latest.filter((i) => !seen.has(i.cartId || productIdOf(i)));
        const finalCart = [...merged, ...addedMeanwhile];

        dispatch(setCart(finalCart));
        // Only the items the backend knows about count as "already synced";
        // anything added meanwhile will be pushed by the change effect below.
        prevCartRef.current = [...mergedPlain, ...localOnly];
        syncedRef.current = true;
      } catch (err) {
        console.warn("[useCartSync] Failed to sync cart from backend:", err);
        syncedRef.current = true;
        prevCartRef.current = store.getState().cart.cartItems.filter((i) => !isComboLine(i));
      } finally {
        inFlightRef.current = false;
      }
    }

    fetchBackendCart();
  }, [user, token, loading, authFetch, dispatch, store]);

  // Push cart changes to backend when items change
  useEffect(() => {
    if (!syncedRef.current || !cartIdRef.current || !token) return;

    const prev = prevCartRef.current.filter((i) => !isComboLine(i));
    const current = cartItems.filter((i) => !isComboLine(i));

    // Detect added/removed/updated items
    const prevMap = new Map(prev.map((i) => [productIdOf(i), i]));
    const currMap = new Map(current.map((i) => [productIdOf(i), i]));

    // Added or quantity changed
    for (const [id, item] of currMap) {
      const prevItem = prevMap.get(id);
      if (!prevItem) {
        // New item added
        authFetch("/api/cart", {
          method: "POST",
          body: JSON.stringify({
            cart_id: cartIdRef.current,
            product_id: id,
            quantity: item.qty || 1,
          }),
        }).catch(() => {});
      } else if (prevItem.qty !== item.qty) {
        // Quantity changed
        authFetch("/api/cart", {
          method: "PUT",
          body: JSON.stringify({
            cart_id: cartIdRef.current,
            product_id: id,
            quantity: item.qty,
          }),
        }).catch(() => {});
      }
    }

    // Removed items
    for (const [id] of prevMap) {
      if (!currMap.has(id)) {
        authFetch(`/api/cart?cartId=${cartIdRef.current}&productId=${id}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    }

    prevCartRef.current = current;
  }, [cartItems, token, authFetch]);

  return { cartId: cartIdRef.current };
}

/**
 * Enriches raw cart items (product_id + quantity) with product details
 * by fetching from the products API.
 */
async function enrichCartItems(items) {
  try {
    const productIds = items.map((i) => i.product_id);
    const res = await fetch(`/api/products?ids=${productIds.join(",")}`);
    const data = await res.json();
    const products = data?.data?.items ?? data?.data ?? data?.products ?? [];

    const productMap = new Map();
    if (Array.isArray(products)) {
      for (const p of products) {
        productMap.set(p.id, p);
      }
    }

    return items.map((item) => {
      const product = productMap.get(item.product_id);

      // Parse net_weight from product catalog
      let netWeight = BundlePricing.BUNDLE_WEIGHT_GRAMS; // 1 bundle = 6 × 40g = 240g
      if (product?.net_weight) {
        if (typeof product.net_weight === "string") {
          const parsed = parseInt(product.net_weight.replace(/[^0-9]/g, ""), 10);
          if (!isNaN(parsed) && parsed > 0) {
            netWeight = parsed;
          }
        } else if (typeof product.net_weight === "number" && product.net_weight > 0) {
          netWeight = product.net_weight;
        }
      }

      const name = product?.name
        || (product?.flavor ? `${product.flavor} Flavour` : "WIN-DIA Product");

      return {
        id: item.product_id,
        _id: item.product_id,
        name,
        price: product?.price ?? BundlePricing.BUNDLE_PRICE,
        image: product?.image || product?.image_url || "/images/product-methi.jpg",
        flavor: product?.flavor || null,
        qty: item.quantity || 1,
        // count_in_stock is in packets; 0 is a real value (out of stock)
        countInStock: product?.count_in_stock ?? undefined,
        netWeight,
        isComboProduct: COMBO_NAME.test(product?.name || ""),
      };
    });
  } catch {
    // Fallback: return items with minimal data
    return items.map((item) => ({
      id: item.product_id,
      _id: item.product_id,
      name: "WIN-DIA Product",
      price: BundlePricing.BUNDLE_PRICE,
      image: "/images/product-methi.jpg",
      qty: item.quantity || 1,
      netWeight: BundlePricing.BUNDLE_WEIGHT_GRAMS,
      isComboProduct: false,
    }));
  }
}
