import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
  /** Launcher only: gentle pointer attention, normalized to the stage's [-1, 1] bounds. */
  attention?: { x: number; y: number };
  /** An intentional repeat of the same gesture, for example a fresh greeting. */
  replayKey?: string | number;
  className?: string;
}

type Options = Required<Pick<BuddyCharacterProps, "form" | "action" | "expression" | "animated" | "continuousIdle" | "playfulIdle">> & Pick<BuddyCharacterProps, "attention">;
type Engine = typeof import("./buddy-engine.js");
type FormChange = { from: number; to: number; elapsed: number; action: number; style: number; sourcePose: Pose; targetPose: Pose };

const formIndices: Record<BuddyForm, number> = { property: 0, investment: 1, support: 2 };
const actionIndices: Record<BuddyAction, number> = { idle: 0, wave: 1, listen: 2, think: 3, talk: 4, explain: 5, reassure: 10, approve: 19, celebrate: 9, dance: 24 };
const expressionIndices: Record<BuddyExpression, number> = {
  automatic: 0, neutral: 1, warm: 2, curious: 3, focused: 4, thoughtful: 5, delighted: 6,
  reassuring: 7, concerned: 8, surprised: 9, unsure: 10, resting: 11, confident: 12,
};
const restingExpressions: Record<BuddyAction, number> = { idle: 2, wave: 2, listen: 3, think: 5, talk: 2, explain: 2, reassure: 7, approve: 2, celebrate: 6, dance: 6 };
const fallbackImages: Record<BuddyForm, string> = {
  property: "/images/buddy/key-hero-v2.png",
  investment: "/images/buddy/pound-hero-v2.png",
  support: "/images/buddy/heart-hero-v2.png",
};
const blendSeconds = 0.45;
const gestureSeconds: Record<BuddyAction, number> = {
  idle: 0, wave: 2.2, listen: 4.5, think: 4.5, talk: 3.2, explain: 3.2, reassure: 2.8, approve: 1.8, celebrate: 2.4, dance: 3.2,
};
export const BUDDY_FORM_CHANGE_MS = TORNADO_DURATION_SECONDS * 1000;
const transitionSeconds = TORNADO_DURATION_SECONDS;
let atlasPromise: Promise<HTMLImageElement> | undefined;
let handsPromise: Promise<HTMLImageElement> | undefined;

function loadHands(): Promise<HTMLImageElement | undefined> {
  if (!handsPromise) {
    handsPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => { void image.decode().catch(() => undefined).then(() => resolve(image)); };
      image.onerror = () => reject(new Error("Buddy hands unavailable"));
      image.src = "/images/buddy/hands-v3.webp";
    });
  }
  return handsPromise.catch(() => { handsPromise = undefined; return undefined; });
}

function loadAtlas(): Promise<HTMLImageElement> {
  if (!atlasPromise) {
    atlasPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => { void image.decode().catch(() => undefined).then(() => resolve(image)); };
      image.onerror = () => reject(new Error("Buddy artwork unavailable"));
      image.src = "/images/buddy/atlas-v2.webp";
    }).catch((error: unknown) => {
      atlasPromise = undefined;
      throw error;
    });
  }
  return atlasPromise;
}

/** Decorative, transparent v2 artwork. Its containing control supplies the accessible name. */
export function BuddyCharacter({
  form = "property",
  action = "idle",
  expression = "automatic",
  animated = false,
  continuousIdle = false,
  playfulIdle = false,
  attention,
  replayKey,
  className,
}: BuddyCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef<Options>({ form, action, expression, animated, continuousIdle, playfulIdle, attention });
  const updateRef = useRef<((options: Options, replay: boolean) => void) | null>(null);
  const replayRef = useRef(replayKey);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [refinedHands, setRefinedHands] = useState(false);

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
    let currentAction = actionIndices[options.action];
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
    let resting = currentAction === 0;
    let completed = false;
    const idleDirector = createIdleDirector();
    let idleDuration: number | undefined;
    let gaze = { x: 0, y: 0 };

    function stop() {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      container!.dataset.buddyMotion = "off";
    }

    function canAnimate() {
      return options.animated && !reducedMotion.matches && visible && !document.hidden;
    }

    function restingExpression() {
      return options.expression === "automatic" ? restingExpressions[options.action] : expressionIndices[options.expression];
    }

    function attentionTarget() {
      const clampAxis = (value: number | undefined) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value!)) : 0;
      return change ? { x: 0, y: 0 } : { x: clampAxis(options.attention?.x), y: clampAxis(options.attention?.y) };
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

    function draw() {
      if (!engine || !rig || disposed) return;
      const { width, height } = canvas!;
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.clearRect(0, 0, width, height);
      // The supplied rig uses approximately 400 square units, including its arms and whirl.
      const scale = Math.min(width, height) / 400 * 0.94;
      if (change) {
        rig.transition(context!, change.from, change.to, "Tornado", change.elapsed / transitionSeconds,
          change.action, change.style, width / 2, height / 2, scale, change.sourcePose, change.targetPose);
      } else {
        lastPose = currentPose();
        if (lastPose) rig.draw(context!, currentForm, attended(lastPose), width / 2, height / 2, scale);
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

    function showStill() {
      stop();
      currentForm = formIndices[options.form];
      currentAction = actionIndices[options.action];
      currentExpression = expressionIndices[options.expression];
      currentStyle = options.playfulIdle ? 1 : 0;
      gaze = { x: 0, y: 0 };
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
        sourcePose: attended(sourcePose),
        targetPose: engine!.pose(to, actionIndices[options.action], 0.5, currentStyle, expressionIndices[options.expression]),
      };
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
          currentForm = change.to;
          change = undefined;
          setAction(actionIndices[options.action], expressionIndices[options.expression], revealed);
          if (formIndices[options.form] !== currentForm) beginFormChange(formIndices[options.form]);
        }
      } else {
        elapsed += delta;
        gestureElapsed += delta;
        blendElapsed += delta;
        if (blendingFrom && blendElapsed >= blendSeconds) blendingFrom = undefined;
        if (idleDuration !== undefined) {
          if (gestureElapsed >= idleDuration) advanceIdleStep();
        } else if (!resting && gestureElapsed >= gestureSeconds[options.action]) {
          // Finish the gesture where it was drawn, then ease into a calm rest.
          setAction(0, restingExpression(), lastPose);
        } else if (resting && !blendingFrom) {
          if (options.continuousIdle && options.playfulIdle) advanceIdleStep();
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
        || next.playfulIdle !== previous.playfulIdle || next.continuousIdle !== previous.continuousIdle || replay;
      if (formChanged) {
        const target = formIndices[next.form];
        if (change) {
          // Retarget only while artwork is concealed; an already revealed form finishes first.
          const progress = change.elapsed / transitionSeconds;
          if (progress < TORNADO_RETARGET_UNTIL) {
            change.to = target;
            change.targetPose = engine.pose(target, actionIndices[next.action], 0.5, change.style, expressionIndices[next.expression]);
          }
        } else if (target !== currentForm) beginFormChange(target, lastPose);
      }
      if (gestureChanged && !change) setAction(actionIndices[next.action], expressionIndices[next.expression]);
      if (!previous.animated && next.animated && !change) {
        setAction(actionIndices[next.action], expressionIndices[next.expression]);
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
        const [module, atlas, hands] = await Promise.all([import("./buddy-engine.js"), loadAtlas(), loadHands()]);
        if (disposed) return;
        engine = module;
        rig = new module.Character(atlas, hands);
        setRefinedHands(Boolean(hands));
        options = optionsRef.current;
        currentForm = formIndices[options.form];
        setAction(actionIndices[options.action], expressionIndices[options.expression], undefined);
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
    const options = { form, action, expression, animated, continuousIdle, playfulIdle, attention };
    const replay = replayRef.current !== replayKey;
    replayRef.current = replayKey;
    optionsRef.current = options;
    updateRef.current?.(options, replay);
  }, [form, action, expression, animated, continuousIdle, playfulIdle, replayKey, attention?.x, attention?.y]);

  return (
    <div ref={containerRef} aria-hidden="true" data-buddy-form={form} data-buddy-version="v2-refined" data-buddy-artwork="v2" data-buddy-hands={refinedHands ? "v3" : "v2"} data-buddy-status={status} data-buddy-motion="off"
      className={cn("relative isolate aspect-square w-full shrink-0", className)}>
      {status === "failed" && <img src={fallbackImages[form]} alt="" width={1600} height={1600} loading="lazy" decoding="async"
        className="absolute inset-0 h-full w-full object-contain" />}
      <canvas ref={canvasRef} width={400} height={400}
        className={cn("absolute inset-0 h-full w-full", status !== "ready" && "invisible")} />
    </div>
  );
}
