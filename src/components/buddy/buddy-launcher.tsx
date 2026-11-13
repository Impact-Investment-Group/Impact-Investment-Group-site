import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Minus } from "lucide-react";
import { BuddyCharacter } from "./buddy-character";
import { buddyLauncherLabel, isBuddyTopic, type BuddyTopic } from "@/content/buddy";
import { useBuddyPageContext } from "@/hooks/use-buddy-page-context";

type WidgetProps = {
  topic: BuddyTopic;
  onOpen: () => void;
  loading?: boolean;
  failed?: boolean;
  setTrigger?: (node: HTMLButtonElement | null) => void;
};

/** A single compact companion. Minimizing always leaves a keyboard-accessible way back. */
export function BuddyWidget({ topic, onOpen, loading = false, failed = false, setTrigger }: WidgetProps) {
  const [minimized, setMinimized] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const reopen = useRef<HTMLButtonElement>(null);
  const movedFocus = useRef(false);
  const playTrigger = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const playWanted = useRef(false);
  const [PlaySession, setPlaySession] = useState<typeof import("./buddy-play-session").BuddyPlaySession | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playPending, setPlayPending] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [attention, setAttention] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function startPlay() {
    if (playPending) return;
    playWanted.current = true;
    setPlayFailed(false);
    if (PlaySession) { setPlaying(true); return; }
    setPlayPending(true);
    void import("./buddy-play-session").then(module => {
      if (mounted.current) { setPlaySession(() => module.BuddyPlaySession); setPlaying(playWanted.current); setPlayPending(false); }
    }).catch(() => { if (mounted.current) { setPlayPending(false); setPlayFailed(true); } });
  }

  function closePlay() {
    playWanted.current = false;
    setPlaying(false);
  }

  function minimize() {
    closePlay();
    movedFocus.current = true;
    setMinimized(true);
  }

  useEffect(() => {
    if (movedFocus.current) (minimized ? reopen.current : trigger.current)?.focus();
  }, [minimized]);

  return <div data-buddy-widget data-buddy-context={topic} data-buddy-minimized={minimized} className="pointer-events-none fixed z-40 flex flex-col items-end"
    style={{ bottom: "calc(.75rem + env(safe-area-inset-bottom, 0px))", right: "calc(.75rem + env(safe-area-inset-right, 0px))" }}>
    {minimized ? <button ref={reopen} type="button" data-buddy-reopen aria-label="Show Buddy"
      onClick={() => { movedFocus.current = true; setMinimized(false); }}
      className="pointer-events-auto min-h-11 min-w-16 rounded-full border border-rule bg-page px-3 font-heading text-sm font-semibold text-ink shadow-md transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600">
      Buddy
    </button> : <div className={playing ? "hidden" : "relative pb-12"}>
      <button ref={node => { trigger.current = node; setTrigger?.(node); }} type="button" data-buddy-launcher aria-label={buddyLauncherLabel} aria-haspopup="dialog" aria-busy={loading} disabled={loading} onClick={onOpen}
        className="pointer-events-auto flex min-h-11 w-40 flex-col items-center rounded-2xl bg-transparent p-0 text-ink transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 motion-reduce:transform-none sm:w-48 [@media(max-height:500px)]:w-24">
        <span className="block w-full" onPointerMove={event => {
          if (event.pointerType === "touch") return;
          const rect = event.currentTarget.getBoundingClientRect();
          setAttention({ x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 });
        }} onPointerLeave={() => setAttention({ x: 0, y: 0 })}>
          <BuddyCharacter form={topic} action={loading ? "listen" : "wave"} expression="warm" animated={!paused && !playing} attention={attention} continuousIdle playfulIdle={!loading} className="w-full" />
        </span>
        <span className="-mt-1 whitespace-nowrap rounded-full border border-rule bg-page/95 px-3 py-1 text-xs font-semibold leading-5 shadow-sm">{loading ? "Opening..." : buddyLauncherLabel}</span>
      </button>
      <button ref={playTrigger} type="button" data-buddy-play-launcher aria-label={playFailed ? "Retry play" : "Play with Buddy"} aria-busy={playPending} disabled={playPending} onClick={startPlay}
        className="pointer-events-auto absolute bottom-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-rule bg-page px-3 text-xs font-semibold text-ink shadow-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">{playFailed ? "Retry play" : "Play"}</button>
      <button type="button" aria-label="Minimize Buddy" title="Minimize Buddy" onClick={minimize}
        className="pointer-events-auto absolute -right-2 -top-2 flex size-11 items-center justify-center rounded-full text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
        <span className="flex size-6 items-center justify-center rounded-full border border-rule bg-page/95 shadow-sm transition-colors hover:bg-secondary"><Minus aria-hidden="true" className="size-3.5" /></span>
      </button>
    </div>}
    {PlaySession && <PlaySession form={topic} playing={playing} paused={paused} onPause={() => setPaused(value => !value)} onClose={closePlay}
      onMinimize={minimize} onAsk={onOpen} askTrigger={trigger} playTrigger={playTrigger} />}
    {playFailed && !playing && !minimized && <p role="alert" className="pointer-events-auto absolute bottom-full right-0 mb-3 w-64 rounded-2xl border border-rule bg-page p-4 text-sm text-ink shadow-lg">Buddy play could not load.</p>}
    {failed && !minimized && <p role="alert" className="pointer-events-auto absolute bottom-full right-0 mb-3 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-rule bg-page p-4 text-sm leading-relaxed text-ink shadow-lg">Buddy could not open. Try again or <a href="/contact" className="font-semibold underline">contact our team</a>.</p>}
  </div>;
}

/** Keep the conversation and its dependencies off the initial public-page request. */
export function BuddyLauncher() {
  const { pathname } = useLocation();
  const contextTopic = useBuddyPageContext(pathname);
  const pageContext = useRef(contextTopic);
  pageContext.current = contextTopic;
  const [Assistant, setAssistant] = useState<typeof import("./buddy-assistant").BuddyAssistant | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const options = useRef<{ topic: BuddyTopic; trigger: HTMLElement | null }>({ topic: "property", trigger: null });
  const pending = useRef(false);
  const mounted = useRef(true);

  function open(topic?: BuddyTopic) {
    if (pending.current) return;
    options.current = { topic: topic ?? pageContext.current, trigger: document.activeElement as HTMLElement };
    pending.current = true;
    setLoading(true);
    setFailed(false);
    void import("./buddy-assistant").then(module => {
      if (mounted.current) setAssistant(() => module.BuddyAssistant);
    }).catch(() => {
      if (mounted.current) { pending.current = false; setLoading(false); setFailed(true); }
    });
  }

  useEffect(() => {
    mounted.current = true;
    const show = (event: Event) => {
      const topic = (event as CustomEvent<{ topic?: unknown }>).detail?.topic;
      open(isBuddyTopic(topic) ? topic : undefined);
    };
    window.addEventListener("iig:open-buddy", show);
    return () => { mounted.current = false; window.removeEventListener("iig:open-buddy", show); };
  }, []);

  if (Assistant) return <Assistant initialTopic={options.current.topic} initialTrigger={options.current.trigger} contextTopic={contextTopic} />;
  return <BuddyWidget topic={contextTopic} onOpen={() => open()} loading={loading} failed={failed} />;
}
