import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Heart, House, PoundSterling, RotateCcw, Send, X } from "lucide-react";
import { BUDDY_FORM_CHANGE_MS, BuddyCharacter } from "./buddy-character";
import { BuddyWidget } from "./buddy-launcher";
import { isBuddyTopic, type BuddyTopic } from "@/content/buddy";
import { buddyCopy, buddyTopics } from "@/content/buddy-conversation";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Source = { title: string; url: string };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[] };
type Question = { message: string; history: Turn[]; topic: BuddyTopic };
type Readiness = "loading" | "ready" | "unavailable";
const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50";
const topicIcons = { property: House, investment: PoundSterling, support: Heart };

function tabbableElements(root: Document | HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(
    "a[href], area[href], button, input, select, textarea, iframe, object, embed, [contenteditable='true'], [tabindex]",
  )).filter(element => element.tabIndex >= 0 && !element.matches(":disabled") &&
    !element.closest("[hidden], [inert], [aria-hidden='true'], [aria-disabled='true'], [data-radix-focus-guard]") &&
    element.getClientRects().length > 0 && window.getComputedStyle(element).visibility === "visible",
  ).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

function leaveChatAtTabBoundary(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
  const content = event.currentTarget;
  const active = document.activeElement;
  const inside = tabbableElements(content);
  const edge = event.shiftKey ? inside[0] : inside[inside.length - 1];
  if (active !== (edge ?? content)) return;
  const all = tabbableElements(document);
  const current = all.indexOf(active as HTMLElement);
  const direction = event.shiftKey ? -1 : 1;
  const start = current >= 0 ? current : event.shiftKey ? 0 : -1;
  for (let offset = 1; offset <= all.length; offset += 1) {
    const next = all[(start + direction * offset + all.length) % all.length];
    if (next && !content.contains(next)) {
      // Radix loops its FocusScope even with modal=false. Only override that
      // edge; ordinary Tab within the chat and all other keys stay native.
      event.preventDefault();
      event.stopPropagation();
      next.focus();
      return;
    }
  }
}

function safeSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).flatMap(source => {
    if (typeof source?.title !== "string" || typeof source?.url !== "string") return [];
    try {
      const url = new URL(source.url);
      return url.protocol === "https:" && ["impactinvestmentgroup.co.uk", "www.impactinvestmentgroup.co.uk"].includes(url.hostname)
        ? [{ title: source.title.slice(0, 100), url: url.href }] : [];
    } catch { return []; }
  });
}

export function BuddyAssistant({ initialTopic = "property", initialTrigger = null, contextTopic = initialTopic }: { initialTopic?: BuddyTopic; initialTrigger?: HTMLElement | null; contextTopic?: BuddyTopic }) {
  const [open, setOpen] = useState(true);
  const [topic, setTopic] = useState<BuddyTopic>(initialTopic);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const conversation = useRef({ open, topic, started: false });
  conversation.current = { open, topic, started: turns.length > 0 || Boolean(draft) };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<Question | null>(null);
  const [readiness, setReadiness] = useState<Readiness>("loading");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const speakingTimer = useRef<number | undefined>(undefined);
  const abort = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const readinessAbort = useRef<AbortController | null>(null);
  const readinessId = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(initialTrigger);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const current = buddyTopics.find(item => item.id === topic)!;
  const activity = busy ? "think" : typing ? "listen" : speaking ? "talk" : "idle";

  const settleActivity = () => {
    window.clearTimeout(typingTimer.current);
    window.clearTimeout(speakingTimer.current);
    setTyping(false);
    setSpeaking(false);
  };
  const changeDraft = (value: string) => {
    setDraft(value);
    window.clearTimeout(typingTimer.current);
    window.clearTimeout(speakingTimer.current);
    setSpeaking(false);
    setTyping(value.length > 0);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1500);
  };

  const cancel = (notify = true) => {
    requestId.current += 1;
    abort.current?.abort();
    abort.current = null;
    setBusy(false);
    settleActivity();
    if (notify) setError(buddyCopy.cancelled);
  };
  const changeOpen = (next: boolean) => {
    if (!next) {
      if (abort.current) cancel();
      settleActivity();
      readinessId.current += 1;
      readinessAbort.current?.abort();
      readinessAbort.current = null;
    } else {
      if (!turns.length && !draft && !abort.current) setTopic(contextTopic);
      returnFocus.current = document.activeElement as HTMLElement;
      setReadiness("loading");
      setConnectionAttempt(previous => previous + 1);
    }
    setOpen(next);
  };

  useEffect(() => {
    const show = (event: Event) => {
      const next = (event as CustomEvent<{ topic?: unknown }>).detail?.topic;
      // A showcase can suggest the first form, but never retarget or cancel
      // an existing conversation. The model chooses subsequent forms.
      if (!conversation.current.started && !abort.current && isBuddyTopic(next)) setTopic(next);
      returnFocus.current = document.activeElement as HTMLElement;
      if (!conversation.current.open) {
        readinessId.current += 1;
        readinessAbort.current?.abort();
        readinessAbort.current = null;
        setReadiness("loading");
        setConnectionAttempt(previous => previous + 1);
      }
      setOpen(true);
    };
    window.addEventListener("iig:open-buddy", show);
    return () => {
      window.removeEventListener("iig:open-buddy", show);
      requestId.current += 1;
      abort.current?.abort();
      window.clearTimeout(typingTimer.current);
      window.clearTimeout(speakingTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const id = ++readinessId.current;
    readinessAbort.current = controller;
    setReadiness("loading");
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (id === readinessId.current) setReadiness("unavailable");
    }, 6000);
    void (async () => {
      try {
        const response = await fetch(apiUrl("/public/buddy/status"), {
          method: "GET", credentials: "omit", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("unavailable");
        const result = await response.json();
        if (id === readinessId.current && !controller.signal.aborted) {
          setReadiness(result?.configured === true ? "ready" : "unavailable");
        }
      } catch {
        if (id === readinessId.current) setReadiness("unavailable");
      } finally {
        window.clearTimeout(timeout);
        if (id === readinessId.current) readinessAbort.current = null;
      }
    })();
    return () => {
      readinessId.current += 1;
      controller.abort();
      window.clearTimeout(timeout);
      if (readinessAbort.current === controller) readinessAbort.current = null;
    };
  }, [open, connectionAttempt]);

  useEffect(() => {
    if (open && readiness === "ready" && document.activeElement === dialog.current) input.current?.focus();
  }, [open, readiness]);

  useEffect(() => {
    if (open && scroll.current) scroll.current.scrollTop = readiness === "ready" ? scroll.current.scrollHeight : 0;
  }, [turns, busy, error, open, readiness]);

  async function ask(question: Question, isRetry = false) {
    if (!open || readiness !== "ready" || abort.current || !question.message.trim()) return;
    const controller = new AbortController();
    abort.current = controller;
    const id = ++requestId.current;
    settleActivity();
    setError(""); setBusy(true); setRetry(question);
    if (!isRetry) {
      setTurns(previous => [...previous, { role: "user", content: question.message }]);
      setDraft("");
    }
    const timeout = window.setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch(apiUrl("/public/buddy"), {
        method: "POST", credentials: "omit", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...question, history: question.history.map(({ role, content }) => ({ role, content: content.slice(0, 1000) })) }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? "limited" : "unavailable");
      const result = await response.json();
      if (result.used_ai !== true || typeof result.reply !== "string" || !result.reply.trim() || result.reply.length > 3000) throw new Error("unavailable");
      if (id !== requestId.current) return;
      setTurns(previous => [...previous, { role: "assistant", content: result.reply.trim(), sources: safeSources(result.sources) }]);
      const changesForm = isBuddyTopic(result.topic) && result.topic !== topic;
      if (isBuddyTopic(result.topic)) setTopic(result.topic);
      setRetry(null);
      setSpeaking(true);
      const transformTime = changesForm && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? BUDDY_FORM_CHANGE_MS : 0;
      speakingTimer.current = window.setTimeout(() => setSpeaking(false), transformTime + 1800);
    } catch (failure) {
      if (id === requestId.current) setError(failure instanceof Error && failure.message === "limited" ? buddyCopy.limited : buddyCopy.unavailable);
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId.current) { abort.current = null; setBusy(false); }
    }
  }

  const submit = (message: string) => {
    const text = message.trim();
    if (readiness === "ready" && text && text.length <= 1000 && !busy) void ask({ message: text, history: turns.slice(-6), topic });
  };
  const clearConversation = () => {
    cancel(false);
    setTurns([]); setRetry(null); setError(""); setDraft("");
    setTopic(contextTopic);
    (readiness === "ready" ? input.current : dialog.current)?.focus();
  };

  return <Dialog.Root open={open} onOpenChange={changeOpen} modal={false}>
    {!open && <BuddyWidget topic={contextTopic} onOpen={() => changeOpen(true)} setTrigger={node => { launcher.current = node; }} />}
    <Dialog.Portal>
      <Dialog.Content ref={dialog} data-buddy-chat data-buddy-page-topic={contextTopic} data-buddy-readiness={readiness} data-buddy-activity={activity} onKeyDownCapture={leaveChatAtTabBoundary} onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => { event.preventDefault(); (readiness === "ready" ? input.current : dialog.current)?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); (returnFocus.current?.isConnected ? returnFocus.current : launcher.current)?.focus(); }}
        className="fixed bottom-0 right-0 z-50 flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] w-full origin-bottom-right flex-col overflow-hidden rounded-t-3xl border border-rule bg-page text-ink shadow-2xl duration-200 ease-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 motion-reduce:animate-none sm:bottom-5 sm:right-5 sm:h-[min(46rem,calc(100dvh-2.5rem))] sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-md sm:rounded-3xl">
        <header className="shrink-0 border-b border-rule bg-page px-4 pb-4 pt-3 [@media(max-height:600px)]:py-2">
          <div className="flex items-center gap-3">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-secondary [@media(max-height:600px)]:size-14">
              <BuddyCharacter form={topic} action={activity} expression={busy ? "thoughtful" : typing ? "curious" : "warm"} animated={open} continuousIdle className="w-16 [@media(max-height:600px)]:w-12" />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-heading text-2xl font-bold tracking-tight">{buddyCopy.name}</Dialog.Title>
              <span className="mt-1 inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-teal-600">{current.label}</span>
            </div>
            <div className="flex self-start">
              <button type="button" aria-label={buddyCopy.clear} title={buddyCopy.clear} disabled={!turns.length && !draft} onClick={clearConversation} className={cn(control, "size-11 px-0 text-ink-muted hover:bg-page-alt")}><RotateCcw className="size-4" aria-hidden="true" /></button>
              <Dialog.Close aria-label={buddyCopy.close} className={cn(control, "size-11 px-0 text-ink-muted hover:bg-page-alt")}><X className="size-5" aria-hidden="true" /></Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-ink-muted [@media(max-height:600px)]:sr-only">{buddyCopy.description}</Dialog.Description>
        </header>
        <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-page-alt px-4 py-5 sm:px-5">
          {readiness !== "ready" && <div data-buddy-connection className="rounded-2xl border border-rule bg-page-alt p-4">
            <h3 className="font-heading text-xl font-bold">{buddyCopy.connectionHeading}</h3>
            <p role="status" className="mt-2 text-sm leading-relaxed text-ink-muted">{readiness === "loading" ? buddyCopy.connectionLoading : buddyCopy.connectionUnavailable}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</Link>
              <Link to="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</Link>
            </div>
            <button type="button" disabled={readiness === "loading"} onClick={() => { dialog.current?.focus(); setReadiness("loading"); setConnectionAttempt(previous => previous + 1); }} className={cn(control, "mt-2 text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.connectionRetry}</button>
          </div>}
          {readiness === "ready" && turns.length === 0 && <div className="pb-1">
            <h3 className="text-balance font-heading text-2xl font-bold leading-tight tracking-tight">{buddyCopy.welcome}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{buddyCopy.welcomeBody}</p>
            <div className="mt-5 space-y-3">{buddyTopics.map(item => {
              const Icon = topicIcons[item.id];
              return <button key={item.id} type="button" aria-label={item.prompt} onClick={() => submit(item.prompt)} className="group flex min-h-11 w-full items-start gap-3 rounded-2xl border border-rule bg-page p-4 text-left shadow-sm transition-colors hover:border-teal-600 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-teal-600"><Icon className="size-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ink">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-ink-muted">{item.prompt}</span></span>
                <ArrowUpRight aria-hidden="true" className="mt-2 size-4 shrink-0 text-teal-600" />
              </button>;
            })}</div>
          </div>}
          <div role="log" aria-label="Conversation with Buddy" aria-live="polite" aria-relevant="additions" className="space-y-4">
            {turns.map((turn, index) => <div key={index} data-buddy-turn={turn.role} className={cn("rounded-2xl p-4 shadow-sm", turn.role === "user" ? "ml-8 rounded-br-md bg-ink text-white" : "mr-5 rounded-tl-md border border-rule bg-page text-ink")}>
              <p className={cn("mb-2 text-xs font-semibold", turn.role === "user" ? "text-white/80" : "text-teal-600")}>{turn.role === "user" ? "You" : buddyCopy.name}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{turn.content}</p>
              {!!turn.sources?.length && <div className="mt-3 border-t border-rule pt-2"><p className="text-xs font-semibold text-ink-muted">{buddyCopy.sources}</p>{turn.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline underline-offset-4">{source.title}<ArrowUpRight className="size-4" aria-hidden="true" /></a>)}</div>}
            </div>)}
          </div>
          {busy && <div role="status" className="mr-5 mt-4 flex items-center gap-3 rounded-2xl rounded-tl-md border border-rule bg-page p-4 shadow-sm"><span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-teal-600 motion-safe:animate-pulse" /><p className="text-sm font-medium text-teal-600">{buddyCopy.pending}</p></div>}
          {readiness === "ready" && error && <div role="alert" className="mt-4 rounded-2xl border border-rule bg-page-alt p-4"><p className="text-sm leading-relaxed">{error}</p>{retry && <button type="button" onClick={() => void ask(retry, true)} className={cn(control, "mt-2 text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.retry}</button>}<div className="mt-2 flex flex-wrap gap-3"><Link to={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</Link><Link to="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</Link></div></div>}
        </div>
        <form hidden={readiness !== "ready"} onSubmit={event => { event.preventDefault(); submit(draft); }} className="shrink-0 border-t border-rule bg-page px-4 pt-3 sm:px-5" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
          <label htmlFor="buddy-question" className="sr-only">{buddyCopy.input}</label>
          <div className="flex items-end gap-2 rounded-2xl border border-rule bg-page-alt p-2 shadow-sm transition-shadow focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20">
            <textarea id="buddy-question" ref={input} disabled={readiness !== "ready"} value={draft} maxLength={1000} rows={2} placeholder={buddyCopy.placeholder} aria-describedby="buddy-privacy buddy-boundary" onChange={event => changeDraft(event.target.value)} onBlur={() => { window.clearTimeout(typingTimer.current); setTyping(false); }} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(draft); } }} className="min-h-12 min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent p-2 text-base leading-relaxed text-ink outline-none" />
            <button type="submit" aria-label={buddyCopy.send} disabled={readiness !== "ready" || !draft.trim() || busy} className={cn(control, "size-11 shrink-0 bg-orange-600 px-0 text-white shadow-sm hover:bg-orange-700")}><Send className="size-4" aria-hidden="true" /></button>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            {busy && <button type="button" onClick={() => cancel()} className={cn(control, "text-teal-600")}>{buddyCopy.cancel}</button>}
            <span aria-hidden="true" className="ml-auto py-2 font-mono text-xs tabular-nums text-ink-muted">{draft.length}/1000</span>
          </div>
          <p id="buddy-privacy" className="text-xs leading-relaxed text-ink-muted">{buddyCopy.privacy}</p>
          <p id="buddy-boundary" className="mt-1 text-xs leading-relaxed text-ink-muted">{buddyCopy.boundary}</p>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
