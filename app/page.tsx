import type { Metadata } from "next";

import Home from "./Home/Home/Home";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "WIN-DIA FibreRich Thins | Low-GI Coconut Flour Snacks",
  description:
    "Discover WIN-DIA FibreRich Thins — low-GI, high-fibre coconut flour snacks in Jeera, Garlic, Onion, Curry Leaves and assorted combos. No maida, no preservatives, free delivery across India.",
  path: "/",
  absoluteTitle: true,
});

export default function Page() {
  return <Home />;
}
