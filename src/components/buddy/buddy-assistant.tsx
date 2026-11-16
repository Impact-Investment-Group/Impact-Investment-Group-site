import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronDown, History, Mic, RotateCcw, Search, Send, Square, X } from "lucide-react";
import { PAGE_INSPECTION_EVENT } from "./buddy-page-inspector";
import { BUDDY_FORM_CHANGE_MS } from "./buddy-character";
import { BuddySlot } from "./buddy-slot";
import { BuddyWidget } from "./buddy-launcher";
import { isBuddyTopic, type BuddyTopic } from "@/content/buddy";
import { buddyCopy, buddyTopics } from "@/content/buddy-conversation";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition.js";

type Source = { title: string; url: string };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[] };
type Question = { message: string; history: Turn[]; topic: BuddyTopic };
type Readiness = "loading" | "ready" | "unavailable";
const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50";

function fitSpeechViewport(root: HTMLDivElement) {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const top = viewport?.offsetTop ?? 0;
  const margin = window.innerWidth < 640 ? 12 : 20;
  root.style.bottom = `${Math.max(margin, window.innerHeight - top - height + margin)}px`;
  root.style.maxHeight = `${Math.max(80, height - Math.max(80 - top, 8) - margin)}px`;
  const character = root.querySelector<HTMLElement>("[data-buddy-speech-character]");
  if (character) character.style.width = `${height <= 400 ? 64 : height <= 650 ? 112 : window.innerWidth < 640 ? 176 : 192}px`;
}

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
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const conversation = useRef({ open, topic, started: false });
  conversation.current = { open, topic, started: turns.length > 0 || Boolean(draft) };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<Question | null>(null);
  const [readiness, setReadiness] = useState<Readiness>("loading");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [approving, setApproving] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const speakingTimer = useRef<number | undefined>(undefined);
  const abort = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const readinessAbort = useRef<AbortController | null>(null);
  const readinessId = useRef(0);
  const dialog = useRef<HTMLDivElement>(null);
  const attachDialog = useCallback((node: HTMLDivElement | null) => {
    dialog.current = node;
    // Radix can attach its portal after the open effect ran. Fit on every
    // attachment, including reopening after a resize while chat was closed.
    if (node) fitSpeechViewport(node);
  }, []);
  const launcher = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(initialTrigger);
  const scroll = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const current = buddyTopics.find(item => item.id === topic)!;
  const voiceDraft = useRef("");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const speech = useSpeechRecognition({ onFinal: (text: string) => {
    if (!conversation.current.open || abort.current || draftRef.current !== voiceDraft.current) return;
    changeDraft([voiceDraft.current.trim(), text].filter(Boolean).join(" ").slice(0, 1000));
    input.current?.focus();
  } });
  const activity = busy ? "think" : typing || speech.listening ? "listen" : approving ? "approve" : speaking ? "talk" : "idle";
  const latestReply = turns.map(turn => turn.role).lastIndexOf("assistant");
  const displayedDraft = speech.listening && speech.interim
    ? [voiceDraft.current, speech.interim].filter(Boolean).join(" ").slice(0, 1000) : draft;

  const settleActivity = () => {
    window.clearTimeout(typingTimer.current);
    window.clearTimeout(speakingTimer.current);
    setTyping(false);
    setSpeaking(false);
    setApproving(false);
  };
  const changeDraft = (value: string) => {
    setDraft(value);
    window.clearTimeout(typingTimer.current);
    window.clearTimeout(speakingTimer.current);
    setSpeaking(false);
    setApproving(false);
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
      speech.cancel();
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
    if (!open) return;
    const viewport = window.visualViewport;
    const fit = () => {
      const root = dialog.current;
      if (root) fitSpeechViewport(root);
    };
    fit();
    viewport?.addEventListener("resize", fit);
    viewport?.addEventListener("scroll", fit);
    window.addEventListener("resize", fit);
    return () => {
      viewport?.removeEventListener("resize", fit);
      viewport?.removeEventListener("scroll", fit);
      window.removeEventListener("resize", fit);
    };
  }, [open]);

  useEffect(() => {
    if (open && scroll.current) scroll.current.scrollTop = historyOpen ? scroll.current.scrollHeight : 0;
  }, [turns, historyOpen, open]);

  async function ask(question: Question, isRetry = false) {
    if (!open || readiness !== "ready" || abort.current || !question.message.trim()) return;
    const controller = new AbortController();
    abort.current = controller;
    const id = ++requestId.current;
    speech.cancel();
    setHistoryOpen(false);
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
      // A friendly acknowledgement, never an endorsement of a property or return.
      const thanks = /^(?:(?:many |great,? |perfect,? )?thanks|thank you)(?: buddy)?[!. ]*$/i.test(question.message.trim());
      setApproving(thanks);
      const transformTime = changesForm && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? BUDDY_FORM_CHANGE_MS : 0;
      speakingTimer.current = window.setTimeout(() => { setSpeaking(false); setApproving(false); }, transformTime + (thanks ? 3200 : 1800));
    } catch (failure) {
      if (id === requestId.current) setError(failure instanceof Error && failure.message === "limited" ? buddyCopy.limited : buddyCopy.unavailable);
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId.current) { abort.current = null; setBusy(false); }
    }
  }

  const submit = (message: string) => {
    const text = message.trim();
    if (/^(?:show|enlarge|explore|magnify)\b.{0,40}\b(?:this page|page details|page figures)\b/i.test(text) && !busy) {
      inspectPage();
      return;
    }
    if (readiness === "ready" && text && text.length <= 1000 && !busy) void ask({ message: text, history: turns.slice(-6), topic });
  };
  const inspectPage = () => {
    changeOpen(false);
    requestAnimationFrame(() => window.dispatchEvent(new Event(PAGE_INSPECTION_EVENT)));
  };
  const clearConversation = () => {
    speech.reset();
    setHistoryOpen(false);
    cancel(false);
    setTurns([]); setRetry(null); setError(""); setDraft("");
    setTopic(contextTopic);
    (readiness === "ready" ? input.current : dialog.current)?.focus();
  };

  const toggleMicrophone = () => {
    if (speech.listening) speech.stop();
    else { voiceDraft.current = draft; speech.start(); }
  };

  return <Dialog.Root open={open} onOpenChange={changeOpen} modal={false}>
    {!open && <BuddyWidget topic={contextTopic} onOpen={() => changeOpen(true)} setTrigger={node => { launcher.current = node; }} />}
    <Dialog.Portal>
      <Dialog.Content ref={attachDialog} data-buddy-chat data-buddy-interface="speech" data-buddy-page-topic={contextTopic} data-buddy-readiness={readiness} data-buddy-activity={activity}
        onKeyDownCapture={leaveChatAtTabBoundary} onInteractOutside={event => event.preventDefault()}
        onOpenAutoFocus={event => { event.preventDefault(); (readiness === "ready" ? input.current : dialog.current)?.focus(); }}
        onCloseAutoFocus={event => { event.preventDefault(); (returnFocus.current?.isConnected ? returnFocus.current : launcher.current)?.focus(); }}
        className="pointer-events-none fixed bottom-3 right-3 z-50 flex max-h-[calc(100dvh-5rem)] w-[calc(100%-1.5rem)] max-w-sm flex-col items-end overflow-y-auto text-ink outline-none sm:bottom-5 sm:right-5">
        <Dialog.Title className="sr-only">{buddyCopy.name}</Dialog.Title>
        <Dialog.Description className="sr-only">{buddyCopy.description}</Dialog.Description>
        <div data-buddy-speech-bubble className="pointer-events-auto relative flex min-h-16 w-full shrink flex-col overflow-visible rounded-3xl border border-rule bg-page shadow-lg">
          <Dialog.Close aria-label={buddyCopy.close} className={cn(control, "absolute right-1 top-1 z-10 size-11 px-0 text-ink-muted hover:bg-page-alt")}><X className="size-4" aria-hidden="true" /></Dialog.Close>
          <div ref={scroll} data-buddy-speech-scroll className="max-h-[min(36dvh,20rem)] min-h-16 overflow-y-auto overscroll-contain rounded-3xl px-4 py-4 pr-12 [@media(max-height:500px)]:max-h-[25dvh]">
            {readiness !== "ready" && <div data-buddy-connection>
              <p role="status" className="text-sm leading-relaxed text-ink-muted">{readiness === "loading" ? buddyCopy.connectionLoading : buddyCopy.connectionUnavailable}</p>
              {readiness === "unavailable" && <>
                <div className="mt-2 flex flex-wrap gap-2"><Link to={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</Link><Link to="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</Link></div>
                <button type="button" onClick={() => { dialog.current?.focus(); setReadiness("loading"); setConnectionAttempt(previous => previous + 1); }} className={cn(control, "text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.connectionRetry}</button>
              </>}
            </div>}
            {readiness === "ready" && turns.length === 0 && <>
              <p data-buddy-greeting className="text-sm leading-relaxed">{buddyCopy.welcome}</p>
              <div data-buddy-suggestions className="mt-2 flex flex-col items-start">{buddyCopy.suggestions.map(question =>
                <button key={question} type="button" onClick={() => submit(question)} className="min-h-11 rounded-lg px-1 text-left text-xs leading-relaxed text-teal-600 underline decoration-teal-600/30 underline-offset-4 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-teal-600">{question}</button>
              )}</div>
            </>}
            <div role="log" aria-label="Conversation with Buddy" aria-live="polite" aria-relevant="additions text" className="space-y-3">
              {turns.map((turn, index) => <div key={index} data-buddy-turn={turn.role} hidden={!historyOpen && (index !== latestReply || busy || Boolean(error))}>
                {historyOpen && <p className="mb-1 text-xs font-semibold text-teal-600">{turn.role === "user" ? "You" : buddyCopy.name}</p>}
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{turn.content}</p>
                {!!turn.sources?.length && <div className="mt-2 border-t border-rule pt-2"><p className="text-xs font-semibold text-ink-muted">{buddyCopy.sources}</p>{turn.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-xs font-semibold text-teal-600 underline underline-offset-4">{source.title}<ArrowUpRight className="size-3 shrink-0" aria-hidden="true" /></a>)}</div>}
              </div>)}
            </div>
            {busy && <div role="status" className="flex items-center gap-2"><span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-teal-600 motion-safe:animate-pulse" /><p className="text-sm text-teal-600">{buddyCopy.pending}</p></div>}
            {readiness === "ready" && error && <div role="alert"><p className="text-sm leading-relaxed">{error}</p>{retry && <button type="button" onClick={() => void ask(retry, true)} className={cn(control, "mt-1 text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.retry}</button>}<div className="flex flex-wrap gap-2"><Link to={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</Link><Link to="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</Link></div></div>}
          </div>
          <span aria-hidden="true" className="absolute -bottom-2 right-20 size-4 rotate-45 border-b border-r border-rule bg-page" />
        </div>
        <div data-buddy-speech-character className="mr-4 w-44 shrink-0 sm:w-48 [@media(max-height:650px)]:w-28 [@media(max-height:400px)]:w-16">
          <BuddySlot kind="chat" form={topic} action={activity} expression={busy ? "thoughtful" : typing || speech.listening ? "curious" : "warm"} />
        </div>
        <footer className="pointer-events-auto w-full shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <form onSubmit={event => { event.preventDefault(); submit(displayedDraft); }}>
            <label htmlFor="buddy-question" className="sr-only">{buddyCopy.input}</label>
            <div className="flex items-end gap-1 rounded-2xl border border-rule bg-page p-1 shadow-lg focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20">
              <textarea id="buddy-question" ref={input} disabled={readiness !== "ready"} value={displayedDraft} maxLength={1000} rows={1}
                placeholder={speech.listening ? "Listening..." : buddyCopy.placeholder} aria-describedby={noticeOpen ? "buddy-privacy buddy-boundary buddy-voice-note" : undefined}
                onChange={event => { speech.cancel(); changeDraft(event.target.value); }}
                onBlur={() => { window.clearTimeout(typingTimer.current); setTyping(false); }}
                onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(displayedDraft); } }}
                className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent p-2 text-base leading-relaxed text-ink outline-none" />
              <button type="button" aria-label={speech.listening ? "Stop listening" : "Speak to Buddy"} title={speech.supported ? "Speak, review, then send" : "Voice input is unavailable in this browser. You can type instead."}
                aria-pressed={speech.listening} disabled={!speech.supported || readiness !== "ready" || busy} onClick={toggleMicrophone}
                className={cn(control, "size-11 shrink-0 px-0", speech.listening ? "bg-ink text-white" : "text-teal-600 hover:bg-secondary")}>
                {speech.listening ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              </button>
              <button type="submit" aria-label={buddyCopy.send} disabled={readiness !== "ready" || !displayedDraft.trim() || busy} className={cn(control, "size-11 shrink-0 bg-orange-600 px-0 text-white hover:bg-orange-700")}><Send className="size-4" aria-hidden="true" /></button>
            </div>
          </form>
          {(speech.listening || speech.error) && <p role="status" className="mt-1 rounded-xl bg-page px-3 py-2 text-xs text-ink-muted">{speech.listening ? "Listening. Review your words before sending." : speech.error === "not-allowed" || speech.error === "service-not-allowed" ? "Microphone access was declined. You can type your question instead." : "Voice input stopped. Try again or type your question."}</p>}
          <div className="flex items-center justify-between gap-1">
            <button type="button" aria-expanded={noticeOpen} aria-controls="buddy-notices" onClick={() => setNoticeOpen(previous => !previous)} className={cn(control, "gap-1 px-1 text-xs font-normal text-ink-muted hover:text-ink")}>
              {buddyCopy.about}<ChevronDown className={cn("size-3", noticeOpen && "rotate-180")} aria-hidden="true" />
            </button>
            <div className="flex">
              {busy && <button type="button" onClick={() => cancel()} className={cn(control, "px-2 text-xs text-teal-600")}>{buddyCopy.cancel}</button>}
              <button type="button" aria-label="Explore this page with Buddy" title="Explore this page" disabled={busy} onClick={inspectPage} className={cn(control, "size-11 px-0 text-ink-muted hover:bg-page")}><Search className="size-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Conversation history" title="Conversation history" aria-pressed={historyOpen} disabled={!turns.length} onClick={() => setHistoryOpen(previous => !previous)} className={cn(control, "size-11 px-0 text-ink-muted hover:bg-page")}><History className="size-4" aria-hidden="true" /></button>
              <button type="button" aria-label={buddyCopy.clear} title={buddyCopy.clear} disabled={!turns.length && !draft} onClick={clearConversation} className={cn(control, "size-11 px-0 text-ink-muted hover:bg-page")}><RotateCcw className="size-4" aria-hidden="true" /></button>
            </div>
          </div>
          <div id="buddy-notices" hidden={!noticeOpen} className="max-h-28 overflow-y-auto rounded-2xl border border-rule bg-page px-3 py-2">
            <p id="buddy-privacy" className="text-xs leading-relaxed text-ink-muted">{buddyCopy.privacy}</p>
            <p id="buddy-boundary" className="mt-1 text-xs leading-relaxed text-ink-muted">{buddyCopy.boundary}</p>
            <p id="buddy-voice-note" className="mt-1 text-xs leading-relaxed text-ink-muted">Voice is transcribed by your browser's speech service. Review the text before sending.</p>
          </div>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
