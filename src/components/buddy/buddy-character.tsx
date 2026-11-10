import { useEffect, useRef, useState } from "react";
import { Heart, KeyRound, PoundSterling } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Character, Pose } from "./buddy-engine.js";

export type BuddyForm = "property" | "investment" | "support";
export type BuddyAction = "idle" | "wave" | "think" | "talk" | "explain" | "reassure";

export interface BuddyCharacterProps {
  form?: BuddyForm;
  action?: BuddyAction;
  className?: string;
  animated?: boolean;
}

type Options = Required<Pick<BuddyCharacterProps, "form" | "action" | "animated">>;
type Engine = typeof import("./buddy-engine.js");

const formIndices: Record<BuddyForm, number> = { property: 0, investment: 1, support: 2 };
const actionIndices: Record<BuddyAction, number> = {
  idle: 0, wave: 1, think: 3, talk: 4, explain: 5, reassure: 10,
};
const fallbackIcons = { property: KeyRound, investment: PoundSterling, support: Heart };
const gestureSeconds = 4;
const transitionSeconds = 0.85;
let atlasPromise: Promise<HTMLImageElement> | undefined;

function loadAtlas(): Promise<HTMLImageElement> {
  if (!atlasPromise) {
    atlasPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        image.decode().catch(() => undefined).then(() => resolve(image));
      };
      image.onerror = () => reject(new Error("Buddy artwork unavailable"));
      image.src = "/images/buddy/atlas.webp";
    }).catch((error: unknown) => {
      atlasPromise = undefined;
      throw error;
    });
  }
  return atlasPromise;
}

/** One decorative character. Application text owns all accessible topic and status labels. */
export function BuddyCharacter({
  form = "property",
  action = "idle",
  animated = false,
  className,
}: BuddyCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef<Options>({ form, action, animated });
  const updateRef = useRef<((options: Options) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const FallbackIcon = fallbackIcons[form];

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!container || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let visible = !window.IntersectionObserver;
    let loading = false;
    let engine: Engine | undefined;
    let rig: Character | undefined;
    let options = optionsRef.current;
    let currentForm = formIndices[options.form];
    let currentAction = actionIndices[options.action];
    let elapsed = 0.55;
    let frame: number | undefined;
    let lastNow = 0;
    let priorPose: Pose | undefined;
    let change: { from: number; to: number; elapsed: number } | undefined;

    function stop() {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
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

    function draw() {
      if (!engine || !rig || disposed) return;
      const { width, height } = canvas!;
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) / 400 * 0.94;
      if (change) {
        rig.transition(context!, change.from, change.to, "Spin", change.elapsed / transitionSeconds,
          currentAction, 0, width / 2, height / 2, scale);
      } else {
        let currentPose = engine.pose(currentForm, currentAction, elapsed, 0);
        if (priorPose) currentPose = engine.blend(priorPose, currentPose, engine.ease(elapsed / 0.3));
        rig.draw(context!, currentForm, currentPose, width / 2, height / 2, scale);
      }
    }

    function settle() {
      stop();
      currentForm = formIndices[options.form];
      currentAction = actionIndices[options.action];
      change = undefined;
      priorPose = undefined;
      elapsed = 0.55;
      draw();
    }

    function canAnimate() {
      return options.animated && !reducedMotion.matches && visible && !document.hidden;
    }

    function tick(now: number) {
      frame = undefined;
      if (disposed || !canAnimate()) {
        settle();
        return;
      }
      const delta = Math.min(0.08, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      elapsed += delta;
      if (change) {
        change.elapsed += delta;
        if (change.elapsed >= transitionSeconds) {
          currentForm = change.to;
          change = undefined;
        }
      }
      if (elapsed >= gestureSeconds) {
        settle();
        return;
      }
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    function play() {
      stop();
      if (!rig || !canAnimate()) {
        settle();
        return;
      }
      elapsed = 0;
      lastNow = performance.now();
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    function apply(next: Options) {
      const previousForm = change
        ? (change.elapsed < transitionSeconds / 2 ? change.from : change.to)
        : currentForm;
      priorPose = engine?.pose(previousForm, currentAction, elapsed, 0);
      options = next;
      currentAction = actionIndices[next.action];
      const nextForm = formIndices[next.form];
      change = previousForm !== nextForm ? { from: previousForm, to: nextForm, elapsed: 0 } : undefined;
      currentForm = previousForm;
      if (change) priorPose = undefined;
      play();
    }

    async function load() {
      if (loading || rig || disposed) return;
      loading = true;
      try {
        const [module, atlas] = await Promise.all([import("./buddy-engine.js"), loadAtlas()]);
        if (disposed) return;
        engine = module;
        rig = new module.Character(atlas);
        options = optionsRef.current;
        currentForm = formIndices[options.form];
        currentAction = actionIndices[options.action];
        resize();
        setReady(true);
        play();
      } catch {
        // The reserved topic icon remains visible when artwork cannot load.
      }
    }

    function handleMotionChange() {
      if (reducedMotion.matches) settle();
    }

    function handleVisibilityChange() {
      if (document.hidden) settle();
    }

    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => {
          const previouslyVisible = visible;
          visible = entry?.isIntersecting ?? false;
          if (!visible) settle();
          else if (!rig) void load();
          else if (!previouslyVisible) draw();
        })
      : undefined;
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : undefined;

    updateRef.current = apply;
    observer?.observe(container);
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);
    reducedMotion.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (visible) void load();

    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      updateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const options = { form, action, animated };
    optionsRef.current = options;
    updateRef.current?.(options);
  }, [form, action, animated]);

  return (
    <div ref={containerRef} aria-hidden="true" data-buddy-form={form}
      className={cn("relative isolate aspect-square w-full shrink-0", className)}>
      <div className={cn("absolute inset-0 flex items-center justify-center", ready && "invisible")}>
        <span className="flex h-1/2 w-1/2 items-center justify-center rounded-full bg-secondary text-teal-600">
          <FallbackIcon className="h-1/2 w-1/2" strokeWidth={1.5} />
        </span>
      </div>
      <canvas ref={canvasRef} width={400} height={400}
        className={cn("absolute inset-0 h-full w-full", !ready && "invisible")} />
    </div>
  );
}
