import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Apple, BookOpen, Heart, HeartHandshake } from "lucide-react";
import { charity, charityPledge } from "@/content/charity";
import "./charity-impact.css";

const icons = [Apple, HeartHandshake, BookOpen];

function CharityLogo() {
  return (
    <img
      src="/images/charity/metro-world-child-80.png"
      srcSet="/images/charity/metro-world-child-80.png 1x, /images/charity/metro-world-child-160.png 2x"
      width={80}
      height={80}
      loading="lazy"
      alt={charity.name}
    />
  );
}

function BouncyCharityLogo() {
  const stage = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = stage.current;
    const image = logo.current;
    if (!element || !image || !window.IntersectionObserver || !image.animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let played = false;
    let animation: Animation | null = null;
    const stop = () => {
      animation?.cancel();
      animation = null;
      element.dataset["bounce"] = "settled";
    };
    const play = () => {
      if (played || !visible || reduced.matches || document.hidden || !image.complete || !image.naturalWidth) return;
      played = true;
      element.dataset["bounce"] = "playing";
      animation = image.animate([
        { transform: "translateY(0) rotate(0) scale(1)", offset: 0 },
        { transform: "translateY(-20px) rotate(-2deg) scale(.98, 1.02)", offset: .16 },
        { transform: "translateY(0) rotate(0) scale(1.05, .95)", offset: .30 },
        { transform: "translateY(-12px) rotate(1.5deg) scale(.99, 1.01)", offset: .47 },
        { transform: "translateY(0) rotate(0) scale(1.035, .965)", offset: .61 },
        { transform: "translateY(-6px) rotate(-.6deg) scale(1)", offset: .76 },
        { transform: "translateY(0) rotate(0) scale(1.015, .985)", offset: .87 },
        { transform: "translateY(0) rotate(0) scale(1)", offset: 1 },
      ], { duration: 2400, easing: "cubic-bezier(.4, 0, .2, 1)" });
      animation.onfinish = () => { animation = null; element.dataset["bounce"] = "settled"; };
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = (entry?.intersectionRatio ?? 0) >= .35;
      if (!entry?.isIntersecting) stop();
      else play();
    }, { threshold: [0, .35] });
    const visibility = () => { if (document.hidden) stop(); else play(); };
    const motion = () => { if (reduced.matches) stop(); else play(); };
    observer.observe(element);
    image.addEventListener("load", play);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", motion);
    return () => {
      observer.disconnect();
      image.removeEventListener("load", play);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", motion);
      stop();
    };
  }, []);

  return <div ref={stage} data-charity-logo className="relative mx-auto flex h-52 w-64 items-center justify-center sm:h-64 sm:w-80">
    <span aria-hidden="true" className="charity-home-logo-halo absolute inset-0 rounded-full" />
    <svg aria-hidden="true" viewBox="0 0 320 256" className="pointer-events-none absolute inset-0 size-full" fill="none">
      <path d="M57 146C40 102 70 56 113 39C158 22 198 31 238 61C273 88 277 137 255 175C234 211 190 232 144 221C101 211 72 187 57 146Z" className="fill-cream-card" />
      <path d="M79 123C80 76 117 49 164 51C211 53 247 86 245 133C242 178 213 208 166 206C115 204 77 172 79 123Z" className="fill-page/65" />
      <path d="M77 191C100 219 129 230 161 227M227 43C248 54 263 71 271 91" className="stroke-orange-600/15" strokeWidth="1.5" strokeLinecap="round" />
      <g className="stroke-orange-600/30" strokeWidth="2.5" strokeLinecap="round">
        <path d="M53 77L43 70M44 118L31 117M62 163L50 169M264 65L272 57M279 109L291 106M269 157L281 162" />
      </g>
      <g className="fill-orange-600/20"><circle cx="82" cy="40" r="2.5" /><circle cx="248" cy="198" r="3" /><circle cx="49" cy="199" r="2" /></g>
    </svg>
    <div className="charity-home-logo-cutout relative">
      <img ref={logo} src="/images/charity/metro-world-child-160.png" width={160} height={160} loading="lazy" alt={charity.name}
        className="charity-home-logo-mark block size-40 origin-bottom object-contain sm:size-[180px]" />
    </div>
  </div>;
}

export function CharityImpact({ variant = "default" }: { variant?: "default" | "home" } = {}) {
  const [active, setActive] = useState(0);
  const work = charity.work[active] ?? charity.work[0];

  if (variant === "home") return (
    <section id="charity-impact" data-charity-home data-buddy-topic="support" className="charity-home relative isolate overflow-hidden border-y border-orange-600/15 text-ink" aria-labelledby="charity-impact-heading">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-orange-700">{charity.eyebrow}</p>
          <div className="mt-4"><BouncyCharityLogo /></div>
          <h2 id="charity-impact-heading" className="mx-auto mt-3 max-w-[24ch] text-balance font-heading text-[clamp(2.3rem,4.6vw,4.3rem)] font-bold leading-[1.05] tracking-[-.035em]">{charity.heading}</h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-pretty text-base leading-[1.8] text-ink-muted sm:text-lg">{charity.introduction}</p>
        </div>

        <div className="mt-7 grid gap-7 border-t border-orange-600/15 pt-8 lg:mt-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-ink">How Metro World Child helps</h3>
            <div role="group" aria-label="How Metro World Child helps" className="border-t border-orange-600/15">
              {charity.work.map((item, index) => {
                const Icon = icons[index] ?? HeartHandshake;
                return <button key={item.id} type="button" aria-pressed={active === index} aria-controls="charity-work-detail" onClick={() => setActive(index)}
                  className={"group relative flex min-h-16 w-full items-center gap-4 border-b border-orange-600/15 px-3 py-3 text-left text-base font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 " + (active === index ? "bg-cream-card text-ink" : "text-ink-muted hover:bg-cream-card/60 hover:text-ink")}>
                  <span aria-hidden="true" className={"absolute inset-y-3 left-0 w-0.5 origin-center bg-orange-600 transition-transform duration-200 ease-out motion-reduce:transition-none " + (active === index ? "scale-y-100" : "scale-y-0")} />
                  <Icon className="size-5 shrink-0 text-orange-700" strokeWidth={1.6} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <ArrowRight className={"size-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none " + (active === index ? "translate-x-0 text-orange-700" : "-translate-x-1 text-ink-muted/50 group-hover:translate-x-0")} aria-hidden="true" />
                </button>;
              })}
            </div>
          </div>
          <div id="charity-work-detail" role="region" aria-labelledby="charity-work-title" aria-live="polite" className="flex min-h-80 items-center border-l border-orange-600/25 pl-6 min-[360px]:min-h-72 sm:min-h-64 sm:pl-8">
            <div key={work.id} className="charity-home-story max-w-[48ch]">
              <h4 id="charity-work-title" className="max-w-[23ch] text-balance font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">{work.title}</h4>
              <p className="mt-4 text-pretty text-base leading-[1.8] text-ink-muted">{work.body}</p>
              <a href={work.source} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline decoration-teal-600/35 underline-offset-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
                Explore this work<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-5 border-y border-orange-600/20 py-6 sm:flex-row sm:items-center sm:gap-8 lg:mt-10">
          <div className="flex shrink-0 items-center gap-3 text-orange-700">
            <HeartHandshake className="size-7" strokeWidth={1.5} aria-hidden="true" />
            <div><p className="font-heading text-3xl font-bold leading-none tabular-nums">10%</p><p className="mt-1 text-sm font-medium text-ink-muted">of our profits</p></div>
          </div>
          <p className="max-w-[80ch] text-pretty text-sm leading-[1.8] text-ink sm:text-base">{charityPledge}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <a href={charity.recordUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
            {charity.action}<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="text-xs leading-relaxed text-ink-muted">{charity.registration}</p>
        </div>
      </div>
    </section>
  );

  return (
    <section
      id="charity-impact"
      data-buddy-topic="support"
      className="charity-impact"
      aria-labelledby="charity-impact-heading"
    >
      <div className="charity-impact__inner">
        <div className="charity-impact__commitment">
          <div className="charity-impact__marks">
            <HeartHandshake size={38} strokeWidth={1.5} aria-hidden="true" />
            <CharityLogo />
          </div>
          <p className="charity-impact__number">
            10<span>%</span>
          </p>
          <p className="charity-impact__number-label">of our profits</p>
          <div className="charity-impact__shares" aria-hidden="true">
            <span className="charity-impact__share-given">
              <Heart size={19} fill="currentColor" />
            </span>
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <p className="charity-impact__recipient">Supporting {charity.name} UK</p>
        </div>

        <div className="charity-impact__story">
          <p className="charity-impact__eyebrow">{charity.eyebrow}</p>
          <h2 id="charity-impact-heading">{charity.heading}</h2>
          <p className="charity-impact__pledge">{charityPledge}</p>
          <p className="charity-impact__introduction">{charity.introduction}</p>

          <div className="charity-impact__work">
            <h3>How Metro World Child helps</h3>
            <div
              className="charity-impact__choices"
              role="group"
              aria-label="How Metro World Child helps"
            >
              {charity.work.map((item, index) => {
                const Icon = icons[index] ?? HeartHandshake;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active === index}
                    aria-controls="charity-work-detail"
                    onClick={() => setActive(index)}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div
              id="charity-work-detail"
              className="charity-impact__detail"
              role="region"
              aria-labelledby="charity-work-title"
              aria-live="polite"
            >
              <h4 id="charity-work-title">{work.title}</h4>
              <p>{work.body}</p>
            </div>
          </div>
          <a
            className="charity-impact__action"
            href={charity.recordUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {charity.action}
            <ArrowUpRight size={18} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="charity-impact__registration">{charity.registration}</p>
        </div>
      </div>
    </section>
  );
}

export function CharityFooter() {
  return (
    <div className="charity-footer" data-charity-footer>
      <CharityLogo />
      <div>
        <p>{charityPledge}</p>
        <a href="/about#charity-impact">
          {charity.footerAction}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
