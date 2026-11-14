import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { createAmbientDirector, type AmbientStep } from "./buddy-ambient-director.js";
import type { Character, Pose } from "./buddy-engine.js";
import { createIdleDirector, TORNADO_DURATION_SECONDS, TORNADO_RETARGET_UNTIL } from "./buddy-motion.js";

export type BuddyForm = "property" | "investment" | "support";
export type BuddyAction = "idle" | "wave" | "listen" | "think" | "talk" | "explain" | "reassure" | "approve" | "celebrate" | "dance";
export type BuddyExpression = "automatic" | "neutral" | "warm" | "curious" | "focused" | "thoughtful" | "delighted" | "reassuring" | "concerned" | "surprised" | "unsure" | "resting" | "confident";

export interface BuddyCharacterProps {
  form?: BuddyForm;
  action?: BuddyAction;
  expression?: BuddyExpression;
  animated?: boolean;
  /** Continue the supplied calm breathing and blink after a bounded gesture. */
  continuousIdle?: boolean;
  /** Launcher only: alternate short supplied gestures with breathing pauses. */
  playfulIdle?: boolean;
  /** Launcher only: occasional decorative acting without animation controls. */
  ambient?: boolean;
  /** Extra scenery extends left without enlarging the containing button. */
  ambientCanvasClassName?: string;
  /** Launcher only: gentle pointer attention, normalized to the stage's [-1, 1] bounds. */
  attention?: { x: number; y: number };
  /** An intentional repeat of the same gesture, for example a fresh greeting. */
  replayKey?: string | number;
  className?: string;
}

type Options = Required<Pick<BuddyCharacterProps, "form" | "action" | "expression" | "animated" | "continuousIdle" | "playfulIdle" | "ambient">> & Pick<BuddyCharacterProps, "attention">;
type Engine = typeof import("./buddy-rig");
type Placement = { x: number; y: number; scale: number };
type AmbientScene = { step: AmbientStep; elapsed: number; sourcePose: Pose; targetPose: Pose };
type AmbientPainter = typeof import("./buddy-play.js");
type FormChange = { from: number; to: number; elapsed: number; action: number; style: number; sourcePose: Pose; targetPose: Pose; placement: Placement; fadingScene?: AmbientScene };

const formIndices: Record<BuddyForm, number> = { property: 0, investment: 1, support: 2 };
// Rig action, resting expression, then bounded gesture seconds.
const actions: Record<BuddyAction, readonly [number, number, number]> = {
  idle: [0, 2, 0], wave: [1, 2, 2.2], listen: [2, 3, 4.5], think: [3, 5, 4.5],
  talk: [4, 2, 3.2], explain: [5, 2, 3.2], reassure: [10, 7, 2.8],
  approve: [19, 2, 1.8], celebrate: [9, 6, 2.4], dance: [24, 6, 3.2],
};
const expressionIndices: Record<BuddyExpression, number> = {
  automatic: 0, neutral: 1, warm: 2, curious: 3, focused: 4, thoughtful: 5, delighted: 6,
  reassuring: 7, concerned: 8, surprised: 9, unsure: 10, resting: 11, confident: 12,
};
const fallbackImages: Record<BuddyForm, string> = {
  property: "/images/buddy/key-hero-v2.png",
  investment: "/images/buddy/pound-hero-v2.png",
  support: "/images/buddy/heart-hero-v2.png",
};
const blendSeconds = 0.45;
export const BUDDY_FORM_CHANGE_MS = TORNADO_DURATION_SECONDS * 1000;
const transitionSeconds = TORNADO_DURATION_SECONDS;
function loadAmbientProps(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error("Buddy scenery unavailable")), 15000);
    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      image.onload = null;
      image.onerror = null;
      if (error) reject(error); else resolve(image);
    }
    function cancel() { finish(new Error("Buddy scenery loading cancelled")); }
    signal.addEventListener("abort", cancel, { once: true });
    image.decoding = "async";
    image.onload = () => { void Promise.resolve(image.decode?.()).catch(() => undefined).then(() => finish()); };
    image.onerror = () => finish(new Error("Buddy scenery unavailable"));
    if (signal.aborted) cancel(); else image.src = src;
  });
}

/** Scalable decorative actor. Its containing control supplies the accessible name. */
export function BuddyCharacter({
  form = "property",
  action = "idle",
  expression = "automatic",
  animated = false,
  continuousIdle = false,
  playfulIdle = false,
  ambient = false,
  ambientCanvasClassName = "h-44 w-64 sm:h-56 sm:w-80",
  attention,
  replayKey,
  className,
}: BuddyCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef<Options>({ form, action, expression, animated, continuousIdle, playfulIdle, ambient, attention });
  const updateRef = useRef<((options: Options, replay: boolean) => void) | null>(null);
  const replayRef = useRef(replayKey);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");


  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!container || !canvas || !context) { setStatus("failed"); return; }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let visible = !window.IntersectionObserver;
    let loading = false;
    let engine: Engine | undefined;
    let rig: Character | undefined;
    let options = optionsRef.current;
    let currentForm = formIndices[options.form];
    let currentAction = actions[options.action][0];
    let currentExpression = expressionIndices[options.expression];
    let currentStyle = options.playfulIdle ? 1 : 0;
    let elapsed = 0;
    let gestureElapsed = 0;
    let blendElapsed = blendSeconds;
    let blendingFrom: Pose | undefined;
    let lastPose: Pose | undefined;
    let change: FormChange | undefined;
    let frame: number | undefined;
    let lastNow = 0;
    let characterPixels = 0;
    let resting = currentAction === 0;
    let completed = false;
    const idleDirector = createIdleDirector();
    let idleDuration: number | undefined;
    let gaze = { x: 0, y: 0 };
    const ambientDirector = createAmbientDirector();
    const ambientAbort = new AbortController();
    let ambientPainter: AmbientPainter | undefined;
    let ambientAtlas: HTMLImageElement | undefined;
    let ambientLoading = false;
    let ambientFailed = false;
    let ambientStep: AmbientStep | undefined;
    let ambientWait = 0;
    let ambientScene: AmbientScene | undefined;
    let lastPlacement: Placement = { x: 0, y: 0, scale: 1 };
    let placementFrom: Placement | undefined;
    let placementElapsed = blendSeconds;

    function stop() {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      container!.dataset.buddyMotion = "off";
    }

    function canAnimate() {
      return options.animated && !reducedMotion.matches && visible && !document.hidden;
    }

    function restingExpression() {
      return options.expression === "automatic" ? actions[options.action][1] : expressionIndices[options.expression];
    }

    function attentionTarget() {
      const clampAxis = (value: number | undefined) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value!)) : 0;
      return change || ambientScene ? { x: 0, y: 0 } : { x: clampAxis(options.attention?.x), y: clampAxis(options.attention?.y) };
    }

    function attentionMoving() {
      const target = attentionTarget();
      return Math.abs(target.x - gaze.x) > 0.001 || Math.abs(target.y - gaze.y) > 0.001;
    }

    function followAttention(delta: number) {
      const target = attentionTarget();
      const amount = 1 - Math.exp(-delta * 7);
      gaze = { x: gaze.x + (target.x - gaze.x) * amount, y: gaze.y + (target.y - gaze.y) * amount };
      if (!attentionMoving()) gaze = target;
    }

    function attended(pose: Pose) {
      if (!gaze.x && !gaze.y) return pose;
      return { ...pose, gazeX: pose.gazeX + gaze.x * 4, gazeY: pose.gazeY + gaze.y * 3,
        rot: pose.rot + gaze.x * 0.018, x: pose.x + gaze.x * 2 };
    }

    function currentPose() {
      if (!engine) return undefined;
      const next = engine.pose(currentForm, currentAction, elapsed, currentStyle, currentExpression);
      return blendingFrom && blendElapsed < blendSeconds
        ? engine.blend(blendingFrom, next, engine.ease(blendElapsed / blendSeconds))
        : next;
    }

    function sampleScene(scene: AmbientScene) {
      return ambientPainter!.sampleAmbientScene(currentForm, scene.step.kind, scene.elapsed,
        scene.step.variant, scene.sourcePose, scene.targetPose);
    }

    function scenePlacement(sample: ReturnType<AmbientPainter["sampleAmbientScene"]>): Placement {
      const bounds = ambientPainter!.AMBIENT_BOUNDS;
      return { x: sample.x - bounds.anchorX, y: sample.y - bounds.anchorY, scale: sample.scale };
    }

    function draw() {
      if (!engine || !rig || disposed) return;
      const { width, height } = canvas!;
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.clearRect(0, 0, width, height);
      // Scenery has a larger transparent canvas, but Buddy retains the original
      // container's scale and right anchor. Only the original button is clickable.
      const characterWidth = options.ambient ? characterPixels : Math.min(width, height);
      const scale = characterWidth / 400 * 0.94;
      const x = options.ambient ? width - characterWidth / 2 : width / 2;
      const y = height / 2;
      const originX = x - (ambientPainter?.AMBIENT_BOUNDS.anchorX ?? 440) * scale;
      const originY = y - (ambientPainter?.AMBIENT_BOUNDS.anchorY ?? 220) * scale;
      if (change) {
        if (change.fadingScene && ambientPainter && change.elapsed < 0.3) {
          const held = change.fadingScene;
          context!.save();
          try {
            context!.globalAlpha *= 1 - engine.ease(change.elapsed / 0.3);
            ambientPainter.drawAmbientScene(context!, { draw() {} } as unknown as Character, ambientAtlas,
              change.from, held.step.kind, held.elapsed, originX, originY, scale,
              held.step.variant, held.sourcePose, held.targetPose);
          } finally { context!.restore(); }
        }
        rig.transition(context!, change.from, change.to, "Tornado", change.elapsed / transitionSeconds,
          change.action, change.style, x + change.placement.x * scale, y + change.placement.y * scale,
          scale * change.placement.scale, change.sourcePose, change.targetPose);
      } else if (ambientScene && ambientPainter) {
        try {
          const sample = sampleScene(ambientScene);
          lastPose = sample.pose;
          lastPlacement = scenePlacement(sample);
          ambientPainter.drawAmbientScene(context!, rig, ambientAtlas, currentForm, ambientScene.step.kind,
            ambientScene.elapsed, originX, originY, scale, ambientScene.step.variant,
            ambientScene.sourcePose, ambientScene.targetPose);
        } catch {
          // Decorative scenery may fail independently; the original character stays usable.
          ambientFailed = true;
          ambientScene = undefined;
          ambientStep = undefined;
          placementFrom = lastPlacement;
          placementElapsed = 0;
          setAction(0, restingExpression(), lastPose);
          draw();
        }
      } else {
        lastPose = currentPose();
        const amount = engine.ease(Math.min(1, placementElapsed / blendSeconds));
        lastPlacement = placementFrom ? { x: placementFrom.x * (1 - amount), y: placementFrom.y * (1 - amount),
          scale: placementFrom.scale + (1 - placementFrom.scale) * amount } : { x: 0, y: 0, scale: 1 };
        if (lastPose) rig.draw(context!, currentForm, attended(lastPose), x + lastPlacement.x * scale,
          y + lastPlacement.y * scale, scale * lastPlacement.scale);
      }
      container!.dataset.buddyAmbient = options.ambient ? (change ? "changing" : ambientScene?.step.kind ?? "rest") : "off";
    }

    async function loadAmbient() {
      if (ambientLoading || ambientPainter || ambientFailed || !canAnimate() || !options.ambient) return;
      ambientLoading = true;
      try {
        const [painter, atlas] = await Promise.all([
          import("./buddy-play.js"),
          loadAmbientProps("/images/buddy/play-props-v1.webp", ambientAbort.signal),
        ]);
        if (disposed) return;
        ambientPainter = painter;
        ambientAtlas = atlas;
      } catch { if (!disposed) ambientFailed = true; }
      finally { ambientLoading = false; }
    }

    function advanceAmbient(delta: number) {
      if (ambientFailed) return;
      if (!ambientStep) { ambientStep = ambientDirector.next(); ambientWait = ambientStep.restSeconds; }
      ambientWait = Math.max(0, ambientWait - delta);
      // Only warm the optional scene shortly before its first visible act.
      if (ambientWait <= 2 && !ambientPainter) void loadAmbient();
      if (ambientWait === 0 && ambientPainter) {
        ambientScene = { step: ambientStep, elapsed: 0, sourcePose: attended(lastPose ?? currentPose()!),
          targetPose: engine!.pose(currentForm, 0, 0.55, 0, restingExpression()) };
        ambientStep = undefined;
      }
    }

    function resize() {
      if (disposed) return;
      const bounds = canvas!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      // Page travel scales the parent. Keep backing pixels tied to layout size,
      // so returning from the small chat slot never stretches a tiny bitmap.
      characterPixels = (container!.clientWidth || container!.getBoundingClientRect().width) * ratio;
      const width = Math.max(1, Math.round((canvas!.clientWidth || bounds.width) * ratio));
      const height = Math.max(1, Math.round((canvas!.clientHeight || bounds.height) * ratio));
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
      }
      draw();
    }

    function showStill() {
      stop();
      currentForm = formIndices[options.form];
      currentAction = actions[options.action][0];
      currentExpression = expressionIndices[options.expression];
      currentStyle = options.playfulIdle ? 1 : 0;
      gaze = { x: 0, y: 0 };
      ambientScene = undefined;
      ambientStep = undefined;
      placementFrom = undefined;
      lastPlacement = { x: 0, y: 0, scale: 1 };
      elapsed = 0.55;
      gestureElapsed = 0;
      blendingFrom = undefined;
      blendElapsed = blendSeconds;
      change = undefined;
      idleDuration = undefined;
      resting = currentAction === 0;
      completed = true;
      draw();
    }

    function setAction(nextAction: number, nextExpression: number, from = lastPose, style = options.playfulIdle ? 1 : 0) {
      blendingFrom = from;
      blendElapsed = from ? 0 : blendSeconds;
      currentAction = nextAction;
      currentExpression = nextExpression;
      currentStyle = style;
      elapsed = 0;
      gestureElapsed = 0;
      resting = nextAction === 0;
      completed = false;
      idleDuration = undefined;
    }

    function advanceIdleStep() {
      const step = idleDirector.next(currentForm);
      setAction(step.action, step.expression, lastPose, step.style);
      idleDuration = step.seconds;
    }

    function beginFormChange(to: number, sourcePose = currentPose()!) {
      change = {
        from: currentForm, to, elapsed: 0, action: currentAction, style: currentStyle,
        sourcePose: ambientScene ? sourcePose : attended(sourcePose),
        placement: { ...lastPlacement }, fadingScene: ambientScene,
        targetPose: engine!.pose(to, actions[options.action][0], 0.5, currentStyle, expressionIndices[options.expression]),
      };
      ambientScene = undefined;
      // A pending act keeps its remaining rest through a contextual form change.
      // An active scene already consumed its step and begins a fresh rest later.
      blendingFrom = undefined;
      completed = false;
    }

    function tick(now: number) {
      frame = undefined;
      if (disposed || !canAnimate()) { container!.dataset.buddyMotion = "off"; return; }
      const delta = Math.min(0.08, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      followAttention(delta);
      if (change) {
        change.elapsed += delta;
        if (change.elapsed >= transitionSeconds) {
          const revealed = change.targetPose;
          placementFrom = change.placement;
          placementElapsed = 0;
          currentForm = change.to;
          change = undefined;
          setAction(actions[options.action][0], expressionIndices[options.expression], revealed);
          if (formIndices[options.form] !== currentForm) beginFormChange(formIndices[options.form]);
        }
      } else if (ambientScene && ambientPainter) {
        ambientScene.elapsed = Math.min(ambientScene.step.seconds, ambientScene.elapsed + delta);
        if (ambientScene.elapsed >= ambientScene.step.seconds) {
          const settled = sampleScene(ambientScene);
          lastPose = settled.pose;
          lastPlacement = scenePlacement(settled);
          placementFrom = lastPlacement;
          placementElapsed = 0;
          ambientScene = undefined;
          setAction(0, restingExpression(), lastPose, 0);
        }
      } else {
        elapsed += delta;
        placementElapsed += delta;
        gestureElapsed += delta;
        blendElapsed += delta;
        if (blendingFrom && blendElapsed >= blendSeconds) blendingFrom = undefined;
        if (idleDuration !== undefined) {
          if (gestureElapsed >= idleDuration) advanceIdleStep();
        } else if (!resting && gestureElapsed >= actions[options.action][2]) {
          // Finish the gesture where it was drawn, then ease into a calm rest.
          setAction(0, restingExpression(), lastPose);
        } else if (resting && !blendingFrom) {
          if (options.continuousIdle && options.ambient) advanceAmbient(delta);
          else if (options.continuousIdle && options.playfulIdle) advanceIdleStep();
          else if (!options.continuousIdle) completed = true;
        }
      }
      draw();
      if (!completed || attentionMoving()) {
        frame = window.requestAnimationFrame(tick);
        container!.dataset.buddyMotion = "on";
      } else container!.dataset.buddyMotion = "off";
    }

    function resume() {
      if (disposed || !rig) return;
      if (!options.animated || reducedMotion.matches) { showStill(); return; }
      if (!canAnimate() || frame !== undefined) return;
      if (completed && !options.continuousIdle && !attentionMoving()) { draw(); return; }
      if (completed && options.continuousIdle) {
        setAction(0, restingExpression(), lastPose);
      }
      lastNow = performance.now();
      frame = window.requestAnimationFrame(tick);
      container!.dataset.buddyMotion = "on";
    }

    function apply(next: Options, replay: boolean) {
      const previous = options;
      options = next;
      if (!engine || !rig) return;
      if (!next.animated || reducedMotion.matches) { showStill(); return; }
      const formChanged = next.form !== previous.form;
      const gestureChanged = next.action !== previous.action || next.expression !== previous.expression
        || next.playfulIdle !== previous.playfulIdle || next.continuousIdle !== previous.continuousIdle || next.ambient !== previous.ambient || replay;
      if (formChanged) {
        const target = formIndices[next.form];
        if (change) {
          // Retarget only while artwork is concealed; an already revealed form finishes first.
          const progress = change.elapsed / transitionSeconds;
          if (progress < TORNADO_RETARGET_UNTIL) {
            change.to = target;
            change.targetPose = engine.pose(target, actions[next.action][0], 0.5, change.style, expressionIndices[next.expression]);
          }
        } else if (target !== currentForm) beginFormChange(target, lastPose);
      }
      if (gestureChanged && !change) {
        if (ambientScene) { placementFrom = lastPlacement; placementElapsed = 0; }
        ambientScene = undefined;
        ambientStep = undefined;
        setAction(actions[next.action][0], expressionIndices[next.expression]);
      }
      if (!previous.animated && next.animated && !change) {
        setAction(actions[next.action][0], expressionIndices[next.expression]);
      }
      if (!previous.continuousIdle && next.continuousIdle && completed) {
        setAction(0, restingExpression(), lastPose);
      }
      draw();
      resume();
    }

    async function load() {
      if (loading || rig || disposed) return;
      loading = true;
      try {
        const module = await import("./buddy-rig");
        if (disposed) return;
        engine = module;
        rig = new module.Character();

        options = optionsRef.current;
        currentForm = formIndices[options.form];
        setAction(actions[options.action][0], expressionIndices[options.expression], undefined);
        resize();
        setStatus("ready");
        resume();
      } catch {
        if (!disposed) setStatus("failed");
      }
    }

    function handleMotionChange() {
      if (reducedMotion.matches) showStill();
      else resume();
    }

    function handleVisibilityChange() {
      if (document.hidden) stop();
      else resume();
    }

    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? false;
          if (!visible) stop();
          else if (!rig) void load();
          else resume();
        })
      : undefined;
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : undefined;

    updateRef.current = apply;
    observer?.observe(container);
    resizeObserver?.observe(container);
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    reducedMotion.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (visible) void load();

    return () => {
      disposed = true;
      ambientAbort.abort();
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
    const options = { form, action, expression, animated, continuousIdle, playfulIdle, ambient, attention };
    const replay = replayRef.current !== replayKey;
    replayRef.current = replayKey;
    optionsRef.current = options;
    updateRef.current?.(options, replay);
  }, [form, action, expression, animated, continuousIdle, playfulIdle, ambient, replayKey, attention?.x, attention?.y]);

  return (
    <div ref={containerRef} aria-hidden="true" data-buddy-form={form} data-buddy-version="v4-vector" data-buddy-artwork="vector" data-buddy-hands="vector" data-buddy-status={status} data-buddy-motion="off" data-buddy-ambient={ambient ? "rest" : "off"}
      className={cn("relative isolate aspect-square w-full shrink-0", className)}>
      {status === "failed" && <img src={fallbackImages[form]} alt="" width={1600} height={1600} loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-contain" />}
      <canvas ref={canvasRef} width={400} height={400}
        className={cn("absolute", ambient ? "pointer-events-none right-0 top-1/2 -translate-y-1/2" : "inset-0 h-full w-full", ambient && ambientCanvasClassName, status !== "ready" && "invisible")} />
    </div>
  );
}
