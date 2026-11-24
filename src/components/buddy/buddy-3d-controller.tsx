import { useEffect, useRef, useState } from "react";
import {
  createAmbientDirector,
  type AmbientStep,
} from "./buddy-ambient-director.js";
import type { BuddyRenderer } from "./buddy-3d.js";
import { frameBuddyInspection } from "./buddy-inspection-frame.js";
import { buddyCanvasFrame } from "./buddy-canvas-frame.js";

export type BuddyForm = "property" | "investment" | "support";
export type BuddyAction =
  | "idle"
  | "wave"
  | "listen"
  | "think"
  | "talk"
  | "explain"
  | "reassure"
  | "approve"
  | "celebrate"
  | "dance"
  | "glide"
  | "inspect";
export type BuddyExpression =
  | "automatic"
  | "neutral"
  | "warm"
  | "curious"
  | "focused"
  | "thoughtful"
  | "delighted"
  | "reassuring"
  | "concerned"
  | "surprised"
  | "unsure"
  | "resting"
  | "confident";
export type BuddyInspect = {
  hand: "left" | "right";
  direction: "left" | "right" | "up" | "down";
  radius: number;
};
export interface BuddyCharacterProps {
  form?: BuddyForm;
  action?: BuddyAction;
  expression?: BuddyExpression;
  animated?: boolean;
  continuousIdle?: boolean;
  playfulIdle?: boolean;
  ambient?: boolean;
  ambientCanvasClassName?: string;
  attention?: { x: number; y: number };
  replayKey?: string | number;
  className?: string;
  inspect?: BuddyInspect;
}
type Options = Required<
  Pick<
    BuddyCharacterProps,
    | "form"
    | "action"
    | "expression"
    | "animated"
    | "continuousIdle"
    | "playfulIdle"
    | "ambient"
  >
> &
  Pick<BuddyCharacterProps, "attention" | "inspect">;
export const BUDDY_FORM_CHANGE_MS = 3200;
const duration: Record<BuddyAction, number> = {
  idle: 0,
  wave: 2.4,
  listen: 3.2,
  think: 3.4,
  talk: 2.8,
  explain: 2.8,
  reassure: 3,
  approve: 3.2,
  celebrate: 3,
  dance: 4.8,
  glide: 2,
  inspect: 3.6,
};
const join = (...values: (string | false | undefined)[]) =>
  values.filter(Boolean).join(" ");

/** One canvas and one animation clock across form, action and destination changes. */
export function BuddyCharacter({
  form = "property",
  action = "idle",
  expression = "automatic",
  animated = false,
  continuousIdle = false,
  playfulIdle = false,
  ambient = false,
  ambientCanvasClassName = "h-9/8 w-7/4",
  attention,
  replayKey,
  className,
  inspect,
}: BuddyCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null),
    canvasRef = useRef<HTMLCanvasElement>(null);
  const optionsRef = useRef<Options>({
    form,
    action,
    expression,
    animated,
    continuousIdle,
    playfulIdle,
    ambient,
    attention,
    inspect,
  });
  const updateRef = useRef<((next: Options, replay: boolean) => void) | null>(
    null,
  );
  const replayRef = useRef(replayKey);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current!,
      canvas = canvasRef.current!;
    const actor = container.closest<HTMLElement>("[data-buddy-actor]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false,
      visible = !window.IntersectionObserver,
      loading = false,
      failed = false;
    let renderer: BuddyRenderer | undefined,
      frame: number | undefined,
      lastNow = 0;
    let options = optionsRef.current,
      currentForm = options.form,
      actionTime = 0,
      totalTime = 0;
    let change: { from: BuddyForm; to: BuddyForm; elapsed: number } | undefined;
    let queued: BuddyForm | undefined,
      step: AmbientStep | undefined,
      wait = 0,
      sceneTime: number | undefined;
    const director = createAmbientDirector();
    let quietWait = 0,
      quietRest = 8 + Math.random() * 6,
      quietAction: BuddyAction | undefined,
      quietTime = 0;
    const quietBag: BuddyAction[] = [];
    let lastQuiet: BuddyAction | undefined;
    function nextQuiet() {
      if (!quietBag.length) {
        quietBag.push(
          "listen",
          "think",
          "reassure",
          "wave",
          "explain",
          "inspect",
        );
        for (let i = quietBag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [quietBag[i], quietBag[j]] = [quietBag[j], quietBag[i]];
        }
      }
      let index = quietBag.findIndex((value) => value !== lastQuiet);
      if (index < 0) index = 0;
      lastQuiet = quietBag.splice(index, 1)[0];
      return lastQuiet;
    }
    const gaze = { x: 0, y: 0 };
    let canvasWidth = 400,
      canvasHeight = 400,
      characterSize = 192;
    let inspectionKey = "";
    let inspectionFrame: ReturnType<typeof frameBuddyInspection> | undefined;
    function stop() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      container.dataset.buddyMotion = "off";
    }
    function canDraw() {
      // The placement actor hides in place. IntersectionObserver still reports
      // it in view, so read the actor's own state without forcing layout.
      return (
        visible &&
        !document.hidden &&
        !failed &&
        !disposed &&
        (!actor || (actor.style.visibility === "visible" && actor.style.display !== "none"))
      );
    }
    function canMove() {
      return options.animated && !reduced.matches && canDraw();
    }
    function family() {
      return !options.ambient
        ? "off"
        : change
          ? "changing"
          : sceneTime !== undefined
            ? step?.kind || "rest"
            : "rest";
    }
    function draw() {
      if (!renderer || !canDraw()) return;
      const gestureEnded = actionTime >= duration[options.action];
      let acting: BuddyAction =
        gestureEnded && !options.inspect ? "idle" : options.action;
      let poseTime = acting === "idle" ? totalTime : actionTime;
      if (acting === "idle" && !change && sceneTime === undefined) {
        if (options.ambient && step && wait > 4 && wait < 6.4) {
          acting = (["listen", "think", "reassure"] as const)[step.variant];
          poseTime = ((wait - 4) / 2.4) * duration[acting];
        } else if (quietAction) {
          acting = quietAction;
          poseTime = quietTime;
        }
      }
      const frame = buddyCanvasFrame({ size: characterSize, width: canvasWidth,
        height: canvasHeight, ambient: options.ambient });
      if (options.inspect) {
        const key = [currentForm, characterSize, canvasWidth, canvasHeight,
          options.inspect.hand, options.inspect.direction, options.inspect.radius].join(":");
        if (key !== inspectionKey) {
          inspectionFrame = frameBuddyInspection(renderer, {
            form: currentForm, size: characterSize, width: canvasWidth,
            height: canvasHeight, inspect: options.inspect,
          });
          inspectionKey = key;
        }
      } else {
        inspectionKey = "";
        inspectionFrame = undefined;
      }
      renderer.draw({
        form: currentForm,
        action: acting,
        expression: options.expression,
        time: poseTime,
        size: inspectionFrame?.size ?? characterSize,
        x: inspectionFrame?.x ?? frame.x,
        y: inspectionFrame?.y ?? frame.y,
        attention: options.inspect ? undefined : gaze,
        inspect: inspectionFrame?.inspect,
        transition: change
          ? { from: change.from, to: change.to, progress: change.elapsed / 3.2 }
          : undefined,
        ambient:
          sceneTime !== undefined && step
            ? { kind: step.kind, time: sceneTime, variant: step.variant }
            : undefined,
      });
      container.dataset.buddyAmbient = family();
    }
    function resize() {
      if (!renderer) return;
      canvasWidth = Math.max(
        1,
        canvas.clientWidth || canvas.offsetWidth || container.clientWidth,
      );
      canvasHeight = Math.max(
        1,
        canvas.clientHeight || canvas.offsetHeight || container.clientHeight,
      );
      characterSize = Math.max(
        1,
        container.clientWidth || container.offsetWidth,
      );
      renderer.resize(
        canvasWidth,
        canvasHeight,
        Math.min(2, window.devicePixelRatio || 1),
      );
      draw();
    }
    function still() {
      change = undefined;
      queued = undefined;
      sceneTime = undefined;
      currentForm = options.form;
      stop();
      draw();
    }
    function tick(now: number) {
      frame = undefined;
      if (!canMove()) return stop();
      // Clip and scene durations follow visible elapsed time, even on a slow
      // GPU. resume() rebases lastNow after a hidden/offscreen pause, so those
      // pauses still cannot advance a transformation or skip a quiet rest.
      const delta = Math.max(0, (now - lastNow) / 1000);
      lastNow = now;
      totalTime += delta;
      if (change) {
        change.elapsed += delta;
        if (change.elapsed >= 3.2) {
          currentForm = change.to;
          change = undefined;
          actionTime = 0;
          if (queued && queued !== currentForm)
            change = { from: currentForm, to: queued, elapsed: 0 };
          queued = undefined;
        }
      } else {
        actionTime += delta;
        if (
          options.ambient &&
          actionTime >= duration[options.action] &&
          !options.inspect
        ) {
          if (!step) {
            step = director.next();
            wait = 0;
          }
          if (sceneTime === undefined) {
            wait += delta;
            if (wait >= step.restSeconds) sceneTime = 0;
          } else {
            sceneTime += delta;
            if (sceneTime >= step.seconds) {
              sceneTime = undefined;
              step = undefined;
              wait = 0;
            }
          }
        } else if (!options.ambient) {
          sceneTime = undefined;
        }
        if (
          options.playfulIdle &&
          !options.ambient &&
          !options.inspect &&
          actionTime >= duration[options.action]
        ) {
          if (quietAction) {
            quietTime += delta;
            if (quietTime >= duration[quietAction]) {
              quietAction = undefined;
              quietWait = 0;
              quietRest = 10 + Math.random() * 10;
            }
          } else {
            quietWait += delta;
            if (quietWait >= quietRest) {
              quietAction = nextQuiet();
              quietTime = 0;
            }
          }
        } else {
          quietAction = undefined;
          quietWait = 0;
        }
      }
      const amount = 1 - Math.exp(-delta * 7);
      gaze.x +=
        (Math.max(-1, Math.min(1, options.attention?.x || 0)) - gaze.x) *
        amount;
      gaze.y +=
        (Math.max(-1, Math.min(1, options.attention?.y || 0)) - gaze.y) *
        amount;
      draw();
      const needs =
        change ||
        options.inspect ||
        options.ambient ||
        options.continuousIdle ||
        options.playfulIdle ||
        actionTime < duration[options.action] ||
        Math.abs(gaze.x - (options.attention?.x || 0)) > 0.001 ||
        Math.abs(gaze.y - (options.attention?.y || 0)) > 0.001;
      if (needs) {
        frame = requestAnimationFrame(tick);
        container.dataset.buddyMotion = "on";
      } else stop();
    }
    function resume() {
      if (!renderer || !canMove() || frame !== undefined) return;
      lastNow = performance.now();
      frame = requestAnimationFrame(tick);
      container.dataset.buddyMotion = "on";
    }
    function apply(next: Options, replay: boolean) {
      const previous = options;
      options = next;
      if (!renderer) return;
      if (reduced.matches || !next.animated) {
        still();
        return;
      }
      if (change) {
        if (change.elapsed / 3.2 < 0.56) {
          change.to = next.form;
          queued = undefined;
        } else queued = next.form;
      } else if (next.form !== currentForm) {
        change = { from: currentForm, to: next.form, elapsed: 0 };
        if (sceneTime !== undefined) {
          step = undefined;
          wait = 0;
        }
        sceneTime = undefined;
      }
      if (
        replay ||
        next.action !== previous.action ||
        next.expression !== previous.expression
      ) {
        actionTime = 0;
        sceneTime = undefined;
        quietAction = undefined;
        quietWait = 0;
      }
      if (!previous.animated && next.animated) actionTime = 0;
      resize();
      resume();
    }
    async function load() {
      if (loading || renderer || disposed || failed) return;
      loading = true;
      let phase = "module";
      delete container.dataset.buddyFailure;
      delete container.dataset.buddyError;
      try {
        const module = await import("./buddy-3d.js");
        phase = "model";
        const library = await module.loadBuddyModel();
        if (disposed) return;
        phase = "renderer";
        const instance = await module.createBuddyRenderer(canvas, library);
        if (disposed) {
          instance.dispose();
          return;
        }
        renderer = instance;
        options = optionsRef.current;
        currentForm = options.form;
        phase = "first-frame";
        resize();
        setStatus("ready");
        if (reduced.matches || !options.animated) still();
        else resume();
      } catch (error) {
        if (!disposed) {
          container.dataset.buddyFailure = phase;
          // Static graphics diagnostics only. No stack, credentials or user text.
          container.dataset.buddyError =
            error instanceof Error
              ? `${error.name}: ${error.message}`
                  .replace(/https?:\/\/\S+/g, "[asset]")
                  .slice(0, 180)
              : "Graphics initialization failed";
          failed = true;
          stop();
          setStatus("failed");
        }
      } finally {
        loading = false;
      }
    }
    function lost(event: Event) {
      event.preventDefault();
      if (disposed) return;
      container.dataset.buddyFailure = "context-lost";
      failed = true;
      stop();
      setStatus("failed");
    }
    function restored() {
      if (disposed) return;
      renderer?.dispose({ loseContext: false });
      renderer = undefined;
      failed = false;
      setStatus("loading");
      void load();
    }
    function motion() {
      if (reduced.matches) stop();
      else resume();
    }
    function visibility() {
      if (document.hidden) stop();
      else {
        draw();
        resume();
      }
    }
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? false;
          if (!visible) stop();
          else if (!renderer) void load();
          else {
            draw();
            resume();
          }
        })
      : undefined;
    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(resize)
      : undefined;
    updateRef.current = apply;
    observer?.observe(container);
    resizeObserver?.observe(container);
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", motion);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    if (visible) void load();
    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", motion);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer?.dispose();
      updateRef.current = null;
    };
  }, []);
  useEffect(() => {
    const next = {
      form,
      action,
      expression,
      animated,
      continuousIdle,
      playfulIdle,
      ambient,
      attention,
      inspect,
    };
    const replay = replayRef.current !== replayKey;
    replayRef.current = replayKey;
    optionsRef.current = next;
    updateRef.current?.(next, replay);
  }, [
    form,
    action,
    expression,
    animated,
    continuousIdle,
    playfulIdle,
    ambient,
    replayKey,
    attention?.x,
    attention?.y,
    inspect?.hand,
    inspect?.direction,
    inspect?.radius,
  ]);
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-buddy-form={form}
      data-buddy-version="v5-hologram"
      data-buddy-artwork="3d-glb"
      data-buddy-hands="rigged-left-right"
      data-buddy-status={status}
      data-buddy-motion="off"
      data-buddy-ambient={ambient ? "rest" : "off"}
      className={join(
        "relative isolate aspect-square w-full shrink-0",
        className,
      )}
    >
      {status !== "ready" && (
        <img
          src={`/images/buddy/3d/${form}.png`}
          alt=""
          width={700}
          height={700}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className={join(
          "pointer-events-none absolute",
          ambient
            ? "right-0 top-1/2 translate-x-1/14 -translate-y-1/2"
            : inspect
              ? "inset-0 h-full w-full"
              : "left-1/2 top-0 h-full w-5/4 -translate-x-1/2",
          ambient && ambientCanvasClassName,
          status !== "ready" && "invisible",
        )}
      />
    </div>
  );
}
