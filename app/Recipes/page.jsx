import Recipes from "./Recipes";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata = pageMetadata({
  title: "WIN-DIA Thins Recipes",
  description:
    "Turn WIN-DIA FibreRich Thins into pizzas, chaats, sandwiches, desserts and party platters. Browse quick and easy healthy snack recipes made with our coconut flour thins.",
  path: "/Recipes",
});

export default function Page() {
  return <Recipes />;
}
