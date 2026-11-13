import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Character, DrawLayers, Pose } from "./buddy-engine.js";
import type { PlayKind } from "./buddy-play.js";

type Form = "property" | "investment" | "support";
type Kind = PlayKind | "idle";
type Scene = { kind: Kind; seconds: number; variant: number; finished: boolean };
type Controls = { sync: () => void; restart: () => void };
export interface BuddyPlaygroundProps {
  form: Form;
  paused: boolean;
  onPause: () => void;
  onClose: () => void;
  onAsk: () => void;
  onMinimize: () => void;
  positionClassName: string;
}

const assetBase = "/images/buddy";
const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";
const fallbackImages: Record<Form, string> = { property: "/images/buddy/key-hero-v2.png", investment: "/images/buddy/pound-hero-v2.png", support: "/images/buddy/heart-hero-v2.png" };
const buddyImage = (form: Form) => fallbackImages[form];
const formIndices: Record<Form, number> = { property: 0, investment: 1, support: 2 };
const buttonClass = cn("min-h-11 rounded-xl border border-rule bg-page px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-secondary disabled:opacity-50", FOCUS_RING);
const roundClass = cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-rule bg-page text-ink shadow-sm hover:bg-secondary", FOCUS_RING);

function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error("Buddy play asset unavailable")), 15000);
    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error); else resolve(image);
    }
    function cancel() { finish(new Error("Buddy play loading cancelled")); }
    signal.addEventListener("abort", cancel, { once: true });
    image.decoding = "async";
    image.onload = () => { void Promise.resolve(image.decode?.()).catch(() => undefined).then(() => finish()); };
    image.onerror = () => finish(new Error("Buddy play asset unavailable"));
    if (signal.aborted) cancel(); else image.src = url;
  });
}

/** Local, nonmodal play. No conversation, account or model state enters this component. */
export function BuddyPlayground({ form, paused, onPause, onClose, onAsk, onMinimize, positionClassName }: BuddyPlaygroundProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstControlRef = useRef<HTMLButtonElement>(null);
  const controlsRef = useRef<Controls | null>(null);
  const optionsRef = useRef({ form, paused });
  optionsRef.current = { form, paused };
  const sceneRef = useRef<Scene>({ kind: "idle", seconds: 0, variant: 0, finished: false });
  const variationRef = useRef(0);
  const surpriseRef = useRef(0);
  const restoreRetryFocus = useRef(false);
  const [kind, setKind] = useState<Kind>("idle");
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { firstControlRef.current?.focus(); }, []);

  useEffect(() => {
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    let context: CanvasRenderingContext2D | null = null;
    try { context = canvas?.getContext("2d") ?? null; } catch { /* Static artwork remains usable. */ }
    if (!panel || !canvas || !context) { setStatus("failed"); return; }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const abort = new AbortController();
    let disposed = false;
    let visible = !window.IntersectionObserver;
    let ready = false;
    let frame: number | undefined;
    let lastNow = 0;
    let engine: typeof import("./buddy-engine.js") | undefined;
    let play: typeof import("./buddy-play.js") | undefined;
    let rig: Character | undefined;
    let sceneRig: Character | undefined;
    let morphRig: Character | undefined;
    let heldLayers: DrawLayers | undefined;
    let propsAtlas: HTMLImageElement | undefined;
    let currentForm = formIndices[optionsRef.current.form];
    let lastPose: Pose | undefined;
    let change: { from: number; to: number; seconds: number; scene: Scene; sourcePose: Pose; targetPose?: Pose } | undefined;

    function stop() {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      panel!.dataset.buddyPlayMotion = "off";
    }
    function fail() {
      if (disposed) return;
      ready = false;
      stop();
      abort.abort();
      setStatus("failed");
    }
    function finishScene() {
      const scene = sceneRef.current;
      if (!play || scene.kind === "idle" || scene.kind === "home" || scene.finished) return;
      scene.seconds = play.PLAY_DURATIONS[scene.kind];
      scene.finished = true;
      if (scene.kind === "build") {
        sceneRef.current = { ...scene, kind: "home", seconds: 0 };
        setKind("home");
      } else if (scene.kind !== "door") {
        sceneRef.current = { ...scene, kind: "idle", seconds: 0, finished: false };
        setKind("idle");
      }
    }
    function followForm(frozenScene?: Scene) {
      if (!engine) return;
      const target = formIndices[optionsRef.current.form];
      if (motion.matches) {
        currentForm = target;
        change = undefined;
        panel!.dataset.buddyPlayChanging = "false";
      } else if (!optionsRef.current.paused) {
        if (change) {
          if (target !== change.to && change.seconds / engine.TORNADO_DURATION_SECONDS < engine.TORNADO_RETARGET_UNTIL) {
            change.to = target;
            change.targetPose = undefined;
          }
        } else if (target !== currentForm) {
          const scene = { ...(frozenScene ?? sceneRef.current) };
          change = { from: currentForm, to: target, seconds: 0, scene,
            sourcePose: { ...(lastPose ?? engine.pose(currentForm, 0, scene.seconds, 1, 2)) } };
          panel!.dataset.buddyPlayChanging = "true";
        }
      }
    }
    const paintCharacter: Character["draw"] = (ctx, index, value, x, y, scale = 1, alpha = 1, layers) => {
      if (change && engine && morphRig) {
        change.targetPose ??= { ...value };
        // The transition's own body draw keeps the scene's hand-held prop
        // layer, so a ball or hammer follows the hand into the same whirl.
        heldLayers = layers;
        try {
          morphRig.transition(ctx, change.from, change.to, "Tornado", change.seconds / engine.TORNADO_DURATION_SECONDS,
            0, 1, x, y, scale, change.sourcePose, change.targetPose);
        } finally { heldLayers = undefined; }
      } else {
        lastPose = { ...value };
        rig!.draw(ctx, index, value, x, y, scale, alpha, layers);
      }
    };
    function draw() {
      if (!ready || !engine || !play || !sceneRig || disposed) return;
      try {
        const { width, height } = canvas!;
        context!.setTransform(1, 0, 0, 1, 0, 0);
        context!.clearRect(0, 0, width, height);
        const scale = Math.min(width / 600, height / 440);
        const scene = change?.scene ?? sceneRef.current;
        const index = change?.to ?? currentForm;
        if (scene.kind === "idle") {
          paintCharacter(context!, index, engine.pose(index, 0, scene.seconds, 1, 2), width / 2, height / 2, scale);
        } else {
          play.drawPlayScene(context!, sceneRig, propsAtlas, index, scene.kind, scene.seconds,
            width / 2, height / 2, scale, scene.variant);
        }
      } catch { fail(); }
    }
    function canRun() {
      const scene = sceneRef.current;
      return ready && !disposed && visible && !document.hidden && !optionsRef.current.paused
        && !motion.matches && (Boolean(change) || (scene.kind !== "home" && !scene.finished));
    }
    function tick(now: number) {
      frame = undefined;
      if (!canRun()) { stop(); return; }
      const delta = Math.min(0.08, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      if (change && engine) {
        change.seconds += delta;
        if (change.seconds >= engine.TORNADO_DURATION_SECONDS) {
          const revealed = change;
          currentForm = revealed.to;
          lastPose = revealed.targetPose;
          change = undefined;
          panel!.dataset.buddyPlayChanging = "false";
          followForm(revealed.scene);
        }
      } else {
        const scene = sceneRef.current;
        scene.seconds += delta;
        if (play && scene.kind !== "idle" && scene.seconds >= play.PLAY_DURATIONS[scene.kind]) finishScene();
      }
      draw();
      if (canRun()) {
        frame = window.requestAnimationFrame(tick);
        panel!.dataset.buddyPlayMotion = "on";
      } else stop();
    }
    function sync() {
      stop();
      if (!ready || disposed) return;
      followForm();
      if (motion.matches) {
        finishScene();
        if (sceneRef.current.kind === "idle") sceneRef.current.seconds = 0.55;
      }
      draw();
      if (canRun()) {
        lastNow = performance.now();
        frame = window.requestAnimationFrame(tick);
        panel!.dataset.buddyPlayMotion = "on";
      }
    }
    function resize() {
      if (disposed) return;
      const bounds = canvas!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
      }
      draw();
    }
    const visibility = () => { if (document.hidden) stop(); else sync(); };
    const observer = window.IntersectionObserver ? new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) sync(); else stop();
    }) : undefined;
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : undefined;
    controlsRef.current = { sync, restart: sync };
    observer?.observe(canvas);
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", sync);
    setStatus("loading");
    void Promise.all([
      import("./buddy-engine.js"), import("./buddy-play.js"),
      loadImage(`${assetBase}/atlas-v2.webp`, abort.signal),
      loadImage(`${assetBase}/hands-v3.webp`, abort.signal).catch(() => undefined),
      loadImage(`${assetBase}/play-props-v1.webp`, abort.signal).catch(() => undefined),
    ]).then(([engineModule, playModule, atlas, hands, props]) => {
      if (disposed) return;
      engine = engineModule;
      play = playModule;
      rig = new engine.Character(atlas, hands);
      // Adapters preserve the actual rig instance and its artwork. Only the
      // scene's one body draw is redirected while its clock is frozen.
      sceneRig = Object.create(rig) as Character;
      sceneRig.draw = paintCharacter;
      morphRig = Object.create(rig) as Character;
      morphRig.draw = (ctx, index, value, x, y, scale, alpha) => rig!.draw(ctx, index, value, x, y, scale, alpha, heldLayers);
      currentForm = formIndices[optionsRef.current.form];
      propsAtlas = props;
      ready = true;
      resize();
      if (!ready) return;
      setStatus("ready");
      sync();
      if (restoreRetryFocus.current && document.activeElement === document.body) firstControlRef.current?.focus();
      restoreRetryFocus.current = false;
    }).catch(fail);
    return () => {
      disposed = true;
      stop();
      abort.abort();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", sync);
      controlsRef.current = null;
    };
  }, [attempt]);

  useEffect(() => { controlsRef.current?.sync(); }, [form, paused]);

  function choose(next: PlayKind) {
    sceneRef.current = { kind: next, seconds: 0, variant: variationRef.current++ % 3, finished: false };
    setKind(next);
    controlsRef.current?.restart();
  }
  function retry() {
    restoreRetryFocus.current = true;
    sceneRef.current = { kind: "idle", seconds: 0, variant: 0, finished: false };
    setKind("idle");
    setStatus("loading");
    setAttempt(value => value + 1);
  }

  return <div ref={panelRef} role="region" aria-label="Play with Buddy" data-buddy-playground
    data-buddy-play-kind={kind} data-buddy-play-status={status} data-buddy-play-motion="off" data-buddy-play-changing="false"
    className={cn("pointer-events-auto fixed z-50 flex max-h-full w-72 max-w-full flex-col overflow-y-auto overscroll-contain p-2 sm:w-80", positionClassName)}
    onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); onClose(); } }}>
    <div className="flex shrink-0 items-center justify-end gap-2">
      <button type="button" className={buttonClass} aria-pressed={paused} onClick={onPause}>{paused ? "Resume Buddy" : "Pause Buddy"}</button>
      <button type="button" className={roundClass} aria-label="Minimize Buddy" onClick={onMinimize}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M5 12h14" /></svg>
      </button>
      <button type="button" className={roundClass} aria-label="Close play" onClick={onClose}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>
    <div aria-hidden="true" className="relative aspect-4/3 w-full shrink-0">
      <canvas ref={canvasRef} width={600} height={450} className={cn("absolute inset-0 h-full w-full", status !== "ready" && "invisible")} />
      {status === "failed" && <img src={buddyImage(form)} alt="" width={1600} height={1600} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />}
    </div>
    <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-rule bg-page p-3 shadow-lg" aria-busy={status === "loading"}>
      {status === "failed" && <><p role="alert" className="m-0 text-sm text-ink">Buddy play could not load.</p><button type="button" className={buttonClass} onClick={retry}>Retry play</button></>}
      <div className="grid grid-cols-2 gap-2">
        <button ref={firstControlRef} type="button" className={buttonClass} disabled={status === "failed"} onClick={() => choose("ball")}>Throw ball</button>
        <button type="button" className={buttonClass} disabled={status === "failed"} onClick={() => choose("build")}>Build a home</button>
        <button type="button" className={buttonClass} disabled={status === "failed"} onClick={() => choose("dance")}>Dance</button>
        <button type="button" className={buttonClass} disabled={status === "failed"} onClick={() => choose((["ball", "build", "dance"] as const)[surpriseRef.current++ % 3])}>Surprise me</button>
      </div>
      {kind === "home" && <button type="button" className={buttonClass} onClick={event => {
        const restoreFocus = document.activeElement === event.currentTarget;
        choose("door");
        if (restoreFocus) firstControlRef.current?.focus();
      }}>Open the door</button>}
      <button type="button" className={cn("min-h-11 rounded-xl border border-ink bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-ink/90", FOCUS_RING)} onClick={onAsk}>Ask Buddy</button>
    </div>
  </div>;
}

export default BuddyPlayground;
