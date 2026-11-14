import { useEffect, useRef, useState } from "react";
import { BuddyCharacter, type BuddyAction, type BuddyExpression, type BuddyForm } from "./buddy-character";
import { buddyDestinationRect, followBuddyDestination, selectBuddyDestination, type BuddyDestinationRect } from "./buddy-placement.js";
import type { BuddyPlacement } from "./buddy-slot";
import { safeBuddyCorner } from "./buddy-corner";
import { buddyLauncherLabel, openBuddy } from "@/content/buddy";

type Performance = { form: BuddyForm; action: BuddyAction; expression: BuddyExpression; kind: BuddyPlacement; visible: boolean; ambient: boolean };
const initial: Performance = { form: "property", action: "wave", expression: "warm", kind: "corner", visible: false, ambient: false };

/** This component is never exchanged when chat opens or a route changes. */
export function BuddyActor() {
  const stage = useRef<HTMLDivElement>(null);
  const [performance, setPerformance] = useState(initial);
  const [attention, setAttention] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = stage.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.visualViewport;
    let destination: HTMLElement | null = null;
    let position: BuddyDestinationRect | undefined;
    let target: BuddyDestinationRect | undefined;
    let frame = 0;
    let previousTime = 0;
    let dirty = true;
    let current = initial;
    const watched = new Set<HTMLElement>();

    function assign(next: Performance) {
      if (Object.keys(next).some(key => next[key as keyof Performance] !== current[key as keyof Performance])) {
        current = next;
        setPerformance(next);
      }
    }

    function measure() {
      dirty = false;
      const visibleModal = Array.from(document.querySelectorAll<HTMLElement>('[aria-modal="true"]'))
        .some(modal => !modal.contains(node) && !modal.closest('[aria-hidden="true"], [inert]') &&
          modal.getClientRects().length > 0 && window.getComputedStyle(modal).visibility !== "hidden");
      if (node.closest('[aria-hidden="true"], [inert]') || visibleModal) {
        // Include custom dialogs such as the Site menu, which do not mark the
        // background inert. Buddy's own chat is nonmodal. Removing its box also
        // suspends the renderer's IntersectionObserver clock without resetting
        // its pose, performance or existing canvas instance.
        node.style.display = "none";
        node.dataset.buddySuspended = "modal";
        target = undefined;
        return;
      }
      node.style.display = "";
      node.dataset.buddySuspended = "none";
      const slots = Array.from(document.querySelectorAll<HTMLElement>("[data-buddy-slot]"))
        .filter(element => element.getClientRects().length && window.getComputedStyle(element).visibility !== "hidden")
        .map(element => {
          const rect = element.getBoundingClientRect();
          return { id: element, kind: element.dataset.buddySlot as BuddyPlacement,
            left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
        });
      const live = new Set(slots.map(slot => slot.id));
      watched.forEach(element => { if (!live.has(element)) { resize.unobserve(element); watched.delete(element); } });
      live.forEach(element => { if (!watched.has(element)) { resize.observe(element); watched.add(element); } });
      const next = selectBuddyDestination(slots, destination, { width: window.innerWidth, height: window.innerHeight });
      if (destination !== next?.id) {
        destination?.removeAttribute("data-buddy-occupied");
        const previousIcon = destination?.querySelector<HTMLElement>("[data-buddy-slot-fallback]");
        if (previousIcon) previousIcon.style.opacity = "";
        destination = next?.id ?? null;
        if (destination) {
          destination.setAttribute("data-buddy-occupied", "true");
          const icon = destination.querySelector<HTMLElement>("[data-buddy-slot-fallback]");
          if (icon) icon.style.opacity = "0";
        }
      }
      if (!next || !destination) { target = undefined; node.style.visibility = "hidden"; assign({ ...current, visible: false }); return; }
      const preferred = buddyDestinationRect(next);
      const corner = next.kind === "corner" ? safeBuddyCorner(preferred) : null;
      target = corner ?? preferred;
      node.dataset.buddyTargetX = String(target.x);
      node.dataset.buddyTargetY = String(target.y);
      node.dataset.buddyTargetSize = String(target.size);
      node.style.visibility = "visible";
      node.dataset.buddyPlacement = next.kind;
      assign({ form: destination.dataset.buddySlotForm as BuddyForm,
        action: destination.dataset.buddySlotAction as BuddyAction,
        expression: destination.dataset.buddySlotExpression as BuddyExpression,
        kind: next.kind, visible: true, ambient: corner?.roomForAmbient ?? false });
    }

    function tick(now: number) {
      frame = 0;
      if (document.hidden) return;
      if (dirty) measure();
      if (!target) return;
      position = followBuddyDestination(position, target, previousTime ? (now - previousTime) / 1000 : .016, reduced.matches);
      previousTime = now;
      node.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) scale(${position.size / 256})`;
      const moving = Math.abs(position.x - target.x) + Math.abs(position.y - target.y) + Math.abs(position.size - target.size) > .12;
      node.dataset.buddyTravelling = String(moving);
      if (moving) frame = window.requestAnimationFrame(tick);
    }

    function update() {
      dirty = true;
      if (!frame && !document.hidden) { previousTime = 0; frame = window.requestAnimationFrame(tick); }
    }
    function visibilityChanged() {
      if (document.hidden) { window.cancelAnimationFrame(frame); frame = 0; }
      else update();
    }
    const resize = new ResizeObserver(update);
    resize.observe(document.documentElement);
    const mutations = new MutationObserver(update);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["data-buddy-slot-form", "data-buddy-slot-action", "data-buddy-slot-expression", "aria-hidden", "aria-modal", "hidden", "inert"] });
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    window.addEventListener("animationend", update, true);
    window.addEventListener("transitionend", update, true);
    window.addEventListener("iig:buddy-slots", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibilityChanged);
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.removeEventListener("animationend", update, true);
      window.removeEventListener("transitionend", update, true);
      window.removeEventListener("iig:buddy-slots", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      reduced.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibilityChanged);
      destination?.removeAttribute("data-buddy-occupied");
      const icon = destination?.querySelector<HTMLElement>("[data-buddy-slot-fallback]");
      if (icon) icon.style.opacity = "";
    };
  }, []);

  return <div ref={stage} data-buddy-actor data-buddy-placement="corner" data-buddy-travelling="false"
    className="pointer-events-none invisible fixed left-0 top-0 z-[55] size-64 origin-top-left"
    onPointerMove={event => {
      if (event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      setAttention({ x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 });
    }} onPointerLeave={() => setAttention({ x: 0, y: 0 })}>
    <BuddyCharacter form={performance.form} action={performance.action} expression={performance.expression}
      animated={performance.visible} continuousIdle playfulIdle={performance.kind === "page"}
      ambient={performance.kind === "corner" && performance.ambient && performance.action !== "listen"}
      attention={attention} ambientCanvasClassName="h-72 w-96" className="w-full" />
    {performance.kind !== "chat" && <button type="button" aria-label={buddyLauncherLabel} aria-haspopup="dialog"
      onClick={() => openBuddy(performance.form)}
      className="pointer-events-auto absolute inset-0 rounded-2xl bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600" />}
  </div>;
}
