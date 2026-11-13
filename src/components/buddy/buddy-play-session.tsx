import { useEffect, useRef, useState, type RefObject } from "react";
import { BuddyPlayground } from "./buddy-playground";
import type { BuddyTopic } from "@/content/buddy";

type Props = {
  form: BuddyTopic;
  playing: boolean;
  paused: boolean;
  onPause: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onAsk: () => void;
  askTrigger: RefObject<HTMLButtonElement | null>;
  playTrigger: RefObject<HTMLButtonElement | null>;
};

/** Loaded only by Play. The original launcher and its focus targets stay mounted. */
export function BuddyPlaySession(props: Props) {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-height: 600px)").matches);
  const returnFocus = useRef<"play" | "ask" | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const media = window.matchMedia("(max-height: 600px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (props.playing || !returnFocus.current) return;
    const destination = returnFocus.current;
    returnFocus.current = null;
    const frame = requestAnimationFrame(() => {
      const current = latest.current;
      if (destination === "play") current.playTrigger.current?.focus();
      else { current.askTrigger.current?.focus(); current.onAsk(); }
    });
    return () => cancelAnimationFrame(frame);
  }, [props.playing]);

  function finish(destination: "play" | "ask") {
    returnFocus.current = destination;
    props.onClose();
  }

  if (!props.playing) return null;
  return <BuddyPlayground form={props.form} paused={props.paused} onPause={props.onPause}
    onClose={() => finish("play")} onAsk={() => finish("ask")} onMinimize={props.onMinimize}
    positionClassName={compact ? "fixed inset-y-3 right-3 z-50 overflow-y-auto" : "fixed bottom-3 right-3 z-50"} />;
}
