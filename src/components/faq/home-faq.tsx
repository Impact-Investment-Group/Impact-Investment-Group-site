import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featuredFaq } from "@/content/published-faq";
import { FaqList } from "./faq-list";

export function HomeFaq() {
  return (
    <section id="faqs" aria-labelledby="home-faq-heading" className="faq-home">
      <div className="faq-container faq-home-grid">
        <div>
          <span className="faq-conversation-mark"><MessagesSquare aria-hidden="true" /></span>
          <p className="eyebrow mt-5 text-teal-600">Frequently asked questions</p>
          <h2 id="home-faq-heading" className="mt-3 font-heading text-4xl font-bold leading-tight text-ink">A little clarity.<br />A conversation away.</h2>
          <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-ink-muted">Get to know how we work, who we help and where you fit in.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link to="/faqs">Explore all FAQs</Link></Button>
            <Button asChild variant="ghost"><Link to="/faqs" hash="ask-a-question">Ask a question</Link></Button>
          </div>
        </div>
        <FaqList items={featuredFaq} prefix="home-faq" />
      </div>
    </section>
  );
}
