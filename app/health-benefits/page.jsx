import HealthBenefits from "./HealthBenefits/HealthBenefits";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata = pageMetadata({
  title: "Health Benefits of FibreRich Thins",
  description:
    "Explore the nutrition behind WIN-DIA FibreRich Thins: a GI value of 48, 4.85g dietary fibre and 22g protein per 100g, made with coconut flour and no maida or preservatives.",
  path: "/health-benefits",
});

export default function Page() {
  return <HealthBenefits />;
}
