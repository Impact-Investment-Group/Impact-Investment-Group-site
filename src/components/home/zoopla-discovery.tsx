import * as React from "react";
import "./zoopla-discovery.css";

function DiscoveryStreet() {
  return (
    <div className="zoopla-discovery-scene" aria-hidden="true">
      <svg viewBox="0 0 440 164" fill="none" focusable="false" aria-hidden="true">
        <path d="M14 137H426" className="zoopla-street-line" />
        <path d="M24 149H416" className="zoopla-street-path" />
        {[28, 108, 188, 268, 348].map((left, index) => (
          <g
            key={left}
            transform={`translate(${left} ${index % 2 ? 49 : 39})`}
            className={
              index === 2 ? "zoopla-street-home zoopla-street-home-found" : "zoopla-street-home"
            }
          >
            <path d="M7 34H53V96H7Z" className="zoopla-home-face" />
            <path d="M1 36L30 10L59 36" className="zoopla-home-roof" />
            <path d="M42 20V10H49V27" className="zoopla-home-chimney" />
            <rect x="17" y="43" width="10" height="12" rx="2" className="zoopla-home-window" />
            <rect x="34" y="43" width="10" height="12" rx="2" className="zoopla-home-window" />
            <rect x="23" y="68" width="14" height="28" rx="2" className="zoopla-home-door" />
            <path d="M14 98H46" className="zoopla-home-step" />
          </g>
        ))}
        <g className="zoopla-discovery-magnifier">
          <g transform="translate(218 77)">
            <path d="M-15 17L-43 59H43L15 17Z" className="zoopla-searchlight" />
            <circle r="29" className="zoopla-lens" />
            <path d="M21 21L42 42" className="zoopla-lens-handle" />
            <path d="M-16-5A17 17 0 0 1-4-16" className="zoopla-lens-glint" />
          </g>
        </g>
        <g className="zoopla-discovery-found">
          <circle cx="250" cy="36" r="14" className="zoopla-found-disc" />
          <path
            d="M250 27L252.5 33.5L259 36L252.5 38.5L250 45L247.5 38.5L241 36L247.5 33.5Z"
            className="zoopla-found-spark"
          />
        </g>
      </svg>
    </div>
  );
}

export function ZooplaDiscovery() {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const pointerFocus = React.useRef(false);
  const pointerType = React.useRef<string | null>(null);
  const keyboardFocus = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        keyboardFocus.current = false;
        pointerFocus.current = false;
        pointerType.current = null;
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutsidePointer, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutsidePointer, true);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className="zoopla-discovery-wrap"
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse" && !keyboardFocus.current) setOpen(false);
      }}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !pointerFocus.current) {
          keyboardFocus.current = true;
          setOpen(true);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          keyboardFocus.current = false;
          pointerFocus.current = false;
          pointerType.current = null;
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className="zoopla-discovery-trigger"
        aria-label="Powered by Zoopla"
        aria-expanded={open}
        aria-controls="zoopla-discovery"
        onPointerDown={(event) => {
          pointerFocus.current = true;
          pointerType.current = event.pointerType;
          keyboardFocus.current = false;
        }}
        onPointerCancel={() => {
          pointerFocus.current = false;
          pointerType.current = null;
        }}
        onClick={(event) => {
          if (pointerType.current === "touch" || pointerType.current === "pen") {
            setOpen((current) => !current);
          } else {
            keyboardFocus.current = event.detail === 0;
            setOpen(true);
          }
          pointerFocus.current = false;
          pointerType.current = null;
        }}
      >
        <span>Powered by</span>
        <img
          src="/images/brand/zoopla-ink.webp"
          loading="eager"
          fetchPriority="low"
          alt="Zoopla"
          width={548}
          height={120}
        />
      </button>
      <div
        id="zoopla-discovery"
        role="region"
        aria-label="Discover on-market property"
        className="zoopla-discovery-card"
        hidden={!open}
      >
        <DiscoveryStreet />
        <p className="zoopla-discovery-title">
          Your next best investment could be right under your nose.
        </p>
        <p className="zoopla-discovery-description">Explore the potential in on-market property.</p>
      </div>
    </div>
  );
}
