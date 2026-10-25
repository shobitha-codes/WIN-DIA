export const dynamic = "force-dynamic";
import CheckoutPage from "@/src/frontend/screens/Checkout/CheckoutPage";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CheckoutPage />;
}

