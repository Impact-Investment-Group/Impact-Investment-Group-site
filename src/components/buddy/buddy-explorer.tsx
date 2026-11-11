import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart, House, PoundSterling, MessageCircle, RotateCcw } from "lucide-react";
import { BuddyCharacter } from "./buddy-character";
import { buddyCopy, buddyTopics, openBuddy } from "@/content/buddy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const glyphs = [House, PoundSterling, Heart];

export function BuddyExplorer() {
  const [active, setActive] = useState(0);
  const [motion, setMotion] = useState(false);
  const [replay, setReplay] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const topic = buddyTopics[active]!;
  const select = (index: number) => { setMotion(true); setActive(index); };

  return (
    <section id="meet-buddy" aria-labelledby="buddy-heading" data-buddy-explorer className="border-t border-rule bg-page-alt">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-teal-600">{buddyCopy.eyebrow}</p>
            <h2 id="buddy-heading" className="mt-3 text-balance font-heading text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">{buddyCopy.heading}</h2>
          </div>
          <p className="max-w-md text-pretty text-base leading-relaxed text-ink-muted">{buddyCopy.introduction}</p>
        </div>
        <div role="tablist" aria-label="Explore with Buddy" className="mt-8 grid grid-cols-3 gap-2 rounded-2xl border border-rule bg-page p-2 sm:gap-3">
          {buddyTopics.map((item, index) => {
            const Glyph = glyphs[index]!;
            return <button type="button" key={item.id} role="tab" id={`buddy-tab-${item.id}`} aria-controls={`buddy-panel-${item.id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1}
              ref={node => { tabs.current[index] = node; }}
              onClick={() => select(index)}
              onKeyDown={event => {
                const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
                if (next !== null) { event.preventDefault(); select(next); tabs.current[next]?.focus(); }
              }}
              className={cn("group flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:flex-row sm:gap-3 sm:px-5 sm:text-base", active === index ? "bg-secondary text-teal-600 shadow-sm" : "text-ink-muted hover:bg-page-alt hover:text-ink")}>
              <Glyph aria-hidden="true" className="size-5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.short}</span>
              <span aria-hidden="true" className={cn("hidden size-2 rounded-full sm:ml-auto sm:block", active === index ? "bg-teal-600" : "bg-rule")} />
            </button>;
          })}
        </div>
        <div className="mt-5 grid overflow-hidden rounded-3xl border border-rule bg-page lg:grid-cols-2">
          <div className="relative flex min-h-72 flex-col items-center justify-center overflow-hidden bg-secondary px-6 py-5 sm:min-h-80 lg:min-h-112">
            <div aria-hidden="true" className="absolute size-64 rounded-full border border-teal-600/20 bg-page/60 sm:size-80" />
            <div className="relative w-56 sm:w-72 lg:w-80" data-buddy-stage>
              <BuddyCharacter key={replay} form={topic.id} action={topic.action} animated={motion} className="w-full" />
            </div>
            <div className="relative flex items-center gap-3 rounded-full border border-rule bg-page px-4 py-2 text-sm font-semibold text-ink">
              <span>{buddyCopy.name}</span><span aria-hidden="true" className="h-4 w-px bg-rule" /><span>{topic.label}</span>
            </div>
            <button type="button" aria-label="Replay Buddy's gesture" onClick={() => { setMotion(true); setReplay(value => value + 1); }} className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-teal-600 transition-colors hover:bg-page focus-visible:outline-2 focus-visible:outline-teal-600"><RotateCcw aria-hidden="true" className="size-4" /></button>
          </div>
          <div className="grid p-6 sm:p-9 lg:p-10">
            {buddyTopics.map((item, index) => <div key={item.id} id={`buddy-panel-${item.id}`} role="tabpanel" aria-labelledby={`buddy-tab-${item.id}`} tabIndex={active === index ? 0 : -1} inert={active !== index} aria-hidden={active !== index} className={cn("col-start-1 row-start-1 min-w-0 focus-visible:outline-2 focus-visible:outline-teal-600", active === index ? "visible" : "invisible")}>
              <p className="font-mono text-sm font-medium tabular-nums text-teal-600">{item.number} / 03</p>
              <h3 className="mt-4 max-w-sm text-balance font-heading text-3xl font-bold leading-tight tracking-tight text-ink">{item.heading}</h3>
              <p className="mt-4 max-w-prose text-pretty text-base leading-relaxed text-ink-muted">{item.body}</p>
              <ol className="mt-6 space-y-3">
                {item.steps.map((step, n) => <li key={step} className="flex items-center gap-3 text-sm font-medium leading-relaxed text-ink"><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs tabular-nums text-teal-600">{n + 1}</span>{step}</li>)}
              </ol>
              <p className="mt-6 max-w-prose text-pretty text-sm leading-relaxed text-ink-muted">{item.detail}</p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link to={item.link} className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline-offset-4 hover:underline">{item.linkLabel}<ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" /></Link>
                <Button type="button" size="sm" variant="outline" onClick={() => openBuddy(item.id)}><MessageCircle aria-hidden="true" />{buddyCopy.launcher}</Button>
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
