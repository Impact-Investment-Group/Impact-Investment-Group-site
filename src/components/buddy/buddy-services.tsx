import { useState } from "react";
import { ArrowUpRight, Heart, Home, PoundSterling } from "lucide-react";
import { BuddyCharacter, type BuddyForm } from "./buddy-character";
import { openBuddy } from "@/content/buddy";
import { cn } from "@/lib/utils";

const topics = [
  { id: "property", label: "Property", icon: Home, title: "Finding the right starting point.", description: "Ask how property sourcing works, who we work with and where to go next.", action: "explain" },
  { id: "investment", label: "Costs", icon: PoundSterling, title: "Making the details clearer.", description: "Pricing is coming soon. Contact our team to discuss your requirements and the steps involved. Buddy provides information, not financial advice.", action: "think" },
  { id: "support", label: "Care & support", icon: Heart, title: "Keeping people at the centre.", description: "Understand how housing, care and support organisations connect, and find the right route to our team.", action: "reassure" },
] as const;

/** This is the only in-page Buddy showcase. The homepage stays as it was. */
export function BuddyServices() {
  const [form, setForm] = useState<BuddyForm>("property");
  const topic = topics.find((item) => item.id === form)!;
  return (
    <section aria-labelledby="buddy-services-heading" className="border-y border-rule bg-page-alt" data-buddy-showcase>
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-6 px-5 py-12 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:py-16">
        <div className="mx-auto w-40 sm:w-full">
          <BuddyCharacter form={form} action={topic.action} animated />
        </div>
        <div>
          <p className="text-sm font-semibold text-teal-600">Meet Buddy</p>
          <h2 id="buddy-services-heading" className="mt-2 font-heading text-3xl font-semibold leading-tight text-ink">A familiar face. Help when you need it.</h2>
          <p className="mt-3 max-w-[64ch] leading-relaxed text-ink-muted">Buddy is our AI assistant for questions about our public services. One conversation: a key for property, a £ sign for investment and a heart for care and support. Buddy changes form as your conversation moves between them.</p>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Explore Buddy's forms">
            {topics.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-pressed={form === id} onClick={() => setForm(id)} className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600", form === id ? "border-teal-600 bg-secondary text-teal-600" : "border-rule bg-page text-ink hover:border-teal-600")}>
                <Icon className="size-4" aria-hidden="true" />{label}
              </button>
            ))}
          </div>
          <div className="mt-5 min-h-32 sm:min-h-24" aria-live="polite" aria-atomic="true">
            <h3 className="font-semibold text-ink">{topic.title}</h3>
            <p className="mt-1 max-w-[64ch] text-sm leading-relaxed text-ink-muted">{topic.description}</p>
          </div>
          <button type="button" onClick={() => openBuddy(form)} className="inline-flex min-h-11 items-center gap-2 font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">Open Buddy <ArrowUpRight className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
