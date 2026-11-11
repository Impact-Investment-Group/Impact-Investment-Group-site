import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { buddyCopy, isBuddyTopic, type BuddyTopic } from "@/content/buddy";

/** Keep the dialog and its dependencies off the initial public-page request. */
export function BuddyLauncher() {
  const [Assistant, setAssistant] = useState<typeof import("./buddy-assistant").BuddyAssistant | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const options = useRef<{ topic: BuddyTopic; trigger: HTMLElement | null }>({ topic: "property", trigger: null });
  const pending = useRef(false);
  const mounted = useRef(true);

  function open(topic?: BuddyTopic) {
    if (pending.current) return;
    options.current = { topic: topic ?? (location.pathname.startsWith("/pricing") ? "investment" : "property"), trigger: document.activeElement as HTMLElement };
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

  if (Assistant) return <Assistant initialTopic={options.current.topic} initialTrigger={options.current.trigger} />;
  return <>
    <button type="button" data-buddy-launcher onClick={() => open()} aria-busy={loading} aria-haspopup="dialog" disabled={loading}
      className="fixed bottom-24 right-4 z-40 flex min-h-12 items-center gap-2 rounded-full border border-rule bg-page py-2 pl-3 pr-5 font-heading text-base font-semibold text-ink shadow-lg transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 sm:right-6" style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}>
      <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-teal-600"><KeyRound aria-hidden="true" className="size-5" /></span>{loading ? "Opening Buddy..." : buddyCopy.launcher}
    </button>
    {failed && <p role="alert" className="fixed bottom-40 right-4 z-40 max-w-xs rounded-2xl border border-rule bg-page p-4 text-sm text-ink shadow-lg">Buddy could not open. Try again or <a href="/contact" className="font-semibold underline">contact our team</a>.</p>}
  </>;
}
