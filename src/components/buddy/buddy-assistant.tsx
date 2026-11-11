import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { BuddyCharacter } from "./buddy-character";
import { BuddyWidget } from "./buddy-launcher";
import { buddyCopy, buddyTopicForPath, buddyTopics, isBuddyTopic, type BuddyTopic } from "@/content/buddy";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Source = { title: string; url: string };
type Turn = { role: "user" | "assistant"; content: string; sources?: Source[] };
type Question = { message: string; history: Turn[]; topic: BuddyTopic };
type Readiness = "loading" | "ready" | "unavailable";
const control = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50";

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

export function BuddyAssistant({ initialTopic = "property", initialTrigger = null }: { initialTopic?: BuddyTopic; initialTrigger?: HTMLElement | null }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);
  const [topic, setTopic] = useState<BuddyTopic>(initialTopic);
  const conversation = useRef({ open, topic });
  conversation.current = { open, topic };
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<Question | null>(null);
  const [readiness, setReadiness] = useState<Readiness>("loading");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const typingTimer = useRef<number | undefined>(undefined);
  const speakingTimer = useRef<number | undefined>(undefined);
  const previousPath = useRef(pathname);
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
      returnFocus.current = document.activeElement as HTMLElement;
      setReadiness("loading");
      setConnectionAttempt(previous => previous + 1);
    }
    setOpen(next);
  };

  useEffect(() => {
    if (pathname !== previousPath.current) {
      previousPath.current = pathname;
      // Navigation is page context, not permission to retarget an open chat,
      // a retained conversation, a draft or an in-flight question.
      if (!open && turns.length === 0 && !draft && !abort.current) {
        setTopic(buddyTopicForPath(pathname));
      }
    }
  }, [pathname, open, turns.length, draft]);

  useEffect(() => {
    const show = (event: Event) => {
      const next = (event as CustomEvent<{ topic?: unknown }>).detail?.topic;
      const changingTopic = isBuddyTopic(next) && next !== conversation.current.topic;
      if (changingTopic) {
        const interrupted = Boolean(abort.current);
        cancel(false);
        setRetry(null);
        setError(interrupted ? buddyCopy.cancelled : "");
        setTopic(next);
      }
      returnFocus.current = document.activeElement as HTMLElement;
      // Reopening the same topic must not hide or restart a pending answer.
      if (!conversation.current.open || changingTopic) {
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
      setRetry(null);
      setSpeaking(true);
      speakingTimer.current = window.setTimeout(() => setSpeaking(false), 1800);
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
    (readiness === "ready" ? input.current : dialog.current)?.focus();
  };

  return <Dialog.Root open={open} onOpenChange={changeOpen} modal={false}>
    {!open && <BuddyWidget topic={topic} onOpen={() => changeOpen(true)} setTrigger={node => { launcher.current = node; }} />}
    <Dialog.Portal>
      <Dialog.Content ref={dialog} data-buddy-chat data-buddy-readiness={readiness} onInteractOutside={event => event.preventDefault()} onOpenAutoFocus={event => { event.preventDefault(); (readiness === "ready" ? input.current : dialog.current)?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); (returnFocus.current?.isConnected ? returnFocus.current : launcher.current)?.focus(); }}
        className="fixed bottom-0 right-0 z-50 flex max-h-dvh w-full origin-bottom-right flex-col overflow-y-auto overscroll-contain rounded-t-3xl border border-rule bg-page text-ink shadow-2xl duration-200 ease-out data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 motion-reduce:animate-none sm:bottom-5 sm:right-5 sm:max-h-[calc(100dvh-2.5rem)] sm:max-w-md sm:rounded-3xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-rule bg-secondary py-3 pl-4 pr-3 [@media(max-height:600px)]:py-2">
          <BuddyCharacter form={topic} action={activity} expression={busy ? "thoughtful" : typing ? "curious" : "warm"} animated={open} continuousIdle className="w-14 shrink-0 [@media(max-height:600px)]:w-12" />
          <div className="min-w-0 flex-1">
            <Dialog.Title className="font-heading text-2xl font-bold">{buddyCopy.name}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm leading-relaxed text-ink-muted [@media(max-height:600px)]:sr-only">{buddyCopy.description}</Dialog.Description>
          </div>
          <Dialog.Close aria-label={buddyCopy.close} className={cn(control, "size-11 shrink-0 px-0 hover:bg-page")}><X className="size-5" aria-hidden="true" /></Dialog.Close>
        </header>
        <div role="group" aria-label="Conversation topic" className="flex shrink-0 flex-wrap gap-1 border-b border-rule px-4 py-2">
          {buddyTopics.map(item => <button key={item.id} type="button" disabled={busy} aria-pressed={topic === item.id} onClick={() => {
            if (item.id !== topic) { settleActivity(); setRetry(null); setError(""); setTopic(item.id); }
          }} className={cn(control, "flex-1", topic === item.id ? "bg-secondary text-teal-600" : "text-ink-muted hover:bg-page-alt")}>{item.short}</button>)}
        </div>
        <div ref={scroll} className="min-h-32 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:min-h-52 [@media(max-height:600px)]:min-h-0" style={{ maxHeight: readiness === "ready" ? "min(43dvh, 25rem)" : "min(65dvh, 25rem)" }}>
          {readiness !== "ready" && <div data-buddy-connection className="rounded-2xl border border-rule bg-page-alt p-4">
            <h3 className="font-heading text-xl font-bold">{buddyCopy.connectionHeading}</h3>
            <p role="status" className="mt-2 text-sm leading-relaxed text-ink-muted">{readiness === "loading" ? buddyCopy.connectionLoading : buddyCopy.connectionUnavailable}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</a>
              <a href="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</a>
            </div>
            <button type="button" disabled={readiness === "loading"} onClick={() => { dialog.current?.focus(); setReadiness("loading"); setConnectionAttempt(previous => previous + 1); }} className={cn(control, "mt-2 text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.connectionRetry}</button>
            {turns.length > 0 && <button type="button" onClick={clearConversation} className={cn(control, "mt-2 text-teal-600 hover:bg-secondary")}>{buddyCopy.clear}</button>}
          </div>}
          {readiness === "ready" && turns.length === 0 && <div>
            <MessageCircle className="size-7 text-teal-600" aria-hidden="true" />
            <h3 className="mt-3 text-balance font-heading text-xl font-bold">{buddyCopy.welcome}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{buddyCopy.welcomeBody}</p>
            <button type="button" onClick={() => submit(current.prompt)} className="mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-rule bg-page-alt p-4 text-left text-sm font-medium leading-relaxed text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-teal-600">{current.prompt}<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /></button>
          </div>}
          <div role="log" aria-label="Conversation with Buddy" aria-live="polite" aria-relevant="additions" className="space-y-4">
            {turns.map((turn, index) => <div key={index} data-buddy-turn={turn.role} className={cn("rounded-2xl p-4", turn.role === "user" ? "ml-6 bg-secondary" : "mr-2 border border-rule bg-page")}>
              <p className="mb-2 text-xs font-semibold text-teal-600">{turn.role === "user" ? "You" : buddyCopy.name}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{turn.content}</p>
              {!!turn.sources?.length && <div className="mt-3 border-t border-rule pt-2"><p className="text-xs font-semibold text-ink-muted">{buddyCopy.sources}</p>{turn.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-600 underline underline-offset-4">{source.title}<ArrowUpRight className="size-4" aria-hidden="true" /></a>)}</div>}
            </div>)}
          </div>
          {busy && <div role="status" className="mt-4 rounded-2xl border border-rule p-4"><p className="text-sm font-medium text-teal-600">{buddyCopy.pending}</p><div aria-hidden="true" className="mt-3 space-y-2"><div className="h-2 w-4/5 rounded bg-secondary" /><div className="h-2 w-3/5 rounded bg-secondary" /></div></div>}
          {readiness === "ready" && error && <div role="alert" className="mt-4 rounded-2xl border border-rule bg-page-alt p-4"><p className="text-sm leading-relaxed">{error}</p>{retry && <button type="button" onClick={() => void ask(retry, true)} className={cn(control, "mt-2 text-teal-600 hover:bg-secondary")}><RotateCcw className="size-4" aria-hidden="true" />{buddyCopy.retry}</button>}<div className="mt-2 flex flex-wrap gap-3"><a href={current.link} className={cn(control, "text-teal-600 underline underline-offset-4")}>{current.linkLabel}</a><a href="/contact" className={cn(control, "text-teal-600 underline underline-offset-4")}>Contact our team</a></div></div>}
        </div>
        <form hidden={readiness !== "ready"} onSubmit={event => { event.preventDefault(); submit(draft); }} className="shrink-0 border-t border-rule px-5 pt-3" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
          <label htmlFor="buddy-question" className="block text-sm font-semibold">{buddyCopy.input}</label>
          <div className="mt-2 flex items-end gap-2 rounded-2xl border border-rule bg-page p-2 focus-within:ring-2 focus-within:ring-teal-600">
            <textarea id="buddy-question" ref={input} disabled={readiness !== "ready"} value={draft} maxLength={1000} rows={2} placeholder={buddyCopy.placeholder} aria-describedby="buddy-privacy buddy-boundary" onChange={event => changeDraft(event.target.value)} onBlur={() => { window.clearTimeout(typingTimer.current); setTyping(false); }} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(draft); } }} className="min-h-12 min-w-0 flex-1 resize-none rounded-lg border-0 bg-transparent p-2 text-base leading-relaxed text-ink outline-none" />
            <button type="submit" aria-label={buddyCopy.send} disabled={readiness !== "ready" || !draft.trim() || busy} className={cn(control, "size-11 shrink-0 bg-teal-600 px-0 text-white hover:bg-ink")}><Send className="size-4" aria-hidden="true" /></button>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            {busy ? <button type="button" onClick={() => cancel()} className={cn(control, "text-teal-600")}>{buddyCopy.cancel}</button> : <button type="button" disabled={turns.length === 0} onClick={clearConversation} className={cn(control, "text-teal-600")}>{buddyCopy.clear}</button>}
            <span aria-hidden="true" className="font-mono text-xs tabular-nums text-ink-muted">{draft.length}/1000</span>
          </div>
          <p id="buddy-privacy" className="text-xs leading-relaxed text-ink-muted">{buddyCopy.privacy}</p>
          <p id="buddy-boundary" className="mt-1 text-xs leading-relaxed text-ink-muted">{buddyCopy.boundary}</p>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
