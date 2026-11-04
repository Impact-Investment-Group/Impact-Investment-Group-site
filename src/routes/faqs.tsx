import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { FaqList } from "@/components/faq/faq-list";
import { AskQuestion } from "@/components/faq/ask-question";
import { publishedFaq } from "@/content/published-faq";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/faqs")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "Frequently asked questions | Impact Investment Group" },
      { name: "description", content: "Find answers about Impact Investment Group, supported housing and working together, or ask the team a new question." },
    ],
    links: [{ rel: "canonical", href: "https://impactinvestmentgroup.co.uk/faqs" }],
  }),
});

function FaqPage() {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const items = publishedFaq.filter((item) => words.every((word) => `${item.q} ${item.a.join(" ")}`.toLocaleLowerCase().includes(word)));
  return (
    <div className="faq-page faq-container">
      <header className="faq-page-heading">
        <p className="eyebrow text-teal-600">Frequently asked questions</p>
        <h1 className="mt-3 font-heading text-4xl font-bold leading-tight text-ink sm:text-5xl">Good questions.<br /><span className="text-teal-600">Clear answers.</span></h1>
        <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed text-ink-muted">A place to understand how we work and ask about what matters to you.</p>
        <Button asChild variant="primary" className="mt-6"><a href="#ask-a-question">Ask a new question</a></Button>
      </header>
      <div role="search" className="faq-search">
        <label htmlFor="faq-search" className="sr-only">Search frequently asked questions</label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-4 size-6 text-teal-600" />
        <input ref={search} id="faq-search" type="search" placeholder="Search questions or topics" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label="Clear FAQ search" className="absolute right-1 top-1 grid size-12 place-items-center rounded-xl text-teal-600 focus-visible:outline-2 focus-visible:outline-teal-600" onClick={() => { setQuery(""); search.current?.focus(); }}><X aria-hidden="true" className="size-5" /></button>}
      </div>
      <div className="faq-results">
        <p role="status" className="mb-4 text-sm text-ink-muted">{query.trim() ? `${items.length} ${items.length === 1 ? "answer" : "answers"} found` : "Explore the questions below"}</p>
        {items.length ? <FaqList items={items} /> : <div className="rounded-2xl border border-rule bg-page-alt p-6 text-base text-ink-muted">No answers found. Try another word or <a href="#ask-a-question" className="font-semibold text-teal-600 underline underline-offset-4">ask us your question</a>.</div>}
      </div>
      <AskQuestion />
    </div>
  );
}
