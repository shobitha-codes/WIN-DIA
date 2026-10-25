import Contact from "./Contact";
import { pageMetadata } from "@/src/frontend/lib/seo";

export const metadata = pageMetadata({
  title: "Contact WIN-DIA Foods",
  description:
    "Contact WIN-DIA Foods in Mysuru, Karnataka for order support, product questions, wholesale enquiries and partnerships. Call, email or send us a message.",
  path: "/our-story/contact",
});

export default function ContactPage() {
  return <Contact />;
}
