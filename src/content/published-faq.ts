import { faq, type FaqItem } from "@/content/faq";
import community from "@/content/faq-community.json";

// Only reviewed answers enter this file through the maintainer publication flow.
export const publishedFaq: FaqItem[] = [...faq, ...community];
export const featuredFaq: FaqItem[] = [
  ...faq.filter((item) => ["what", "lease", "residents", "organisations"].includes(item.id)),
  ...community.slice(-2),
];
