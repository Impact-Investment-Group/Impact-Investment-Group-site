import { Plus } from "lucide-react";
import type { FaqItem } from "@/content/faq";
import "./faq.css";

export function FaqList({ items, prefix = "faq" }: { items: FaqItem[]; prefix?: string }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.id} id={`${prefix}-${item.id}`} className="faq-item group">
          <summary className="faq-summary">
            <span>{item.q}</span>
            <span className="faq-plus"><Plus aria-hidden="true" className="size-5 transition-transform group-open:rotate-45 motion-reduce:transition-none" /></span>
          </summary>
          <div className="faq-answer">
            {item.a.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </details>
      ))}
    </div>
  );
}
