export const dynamic = "force-dynamic";
import CartPage from "@/src/frontend/screens/Cart/CartPage";

export const metadata = {
  title: "Cart",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CartPage />;
}

