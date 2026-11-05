import { useEffect, useRef, useState } from "react";

/** Decorative loops run only while visible, in an active tab, with motion enabled. */
export function useVisibleMotion<T extends Element>() {
  const ref = useRef<T>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => {
      setPlaying(inView && !document.hidden && !reduced.matches);
    };
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              update();
            },
            { threshold: 0 },
          );
    if (observer) observer.observe(node);
    else {
      inView = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
    reduced.addEventListener("change", update);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return { ref, playing };
}
