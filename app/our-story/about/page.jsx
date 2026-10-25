import About from "./about";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata = pageMetadata({
  title: "Our Story: Coconut Flour Snacks Rooted in Tradition",
  description:
    "Meet the people and philosophy behind WIN-DIA FibreRich Thins. From Mysuru kitchens to modern low-GI, high-fibre coconut flour snacking, discover how our story began.",
  path: "/our-story/about",
});

export default function AboutPage() {
  return <About />;
}
