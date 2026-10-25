export const dynamic = "force-dynamic";
import { Suspense } from "react";
import OrderConfirmationPage from "@/src/frontend/screens/OrderConfirmation/OrderConfirmationPage";

export const metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", padding: 48 }}>Loading order...</div>}>
      <OrderConfirmationPage />
    </Suspense>
  );
}

