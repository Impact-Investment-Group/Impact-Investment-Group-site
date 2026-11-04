import * as React from "react";
import "./zoopla-discovery.css";

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
        <div className="zoopla-discovery-photo" aria-hidden="true">
          <img
            src="/images/why-estate-aerial-640.webp"
            alt=""
            width={640}
            height={256}
            loading="lazy"
          />
          <span>A fresh look at familiar places</span>
        </div>
        <div className="zoopla-discovery-copy">
          <p className="zoopla-discovery-eyebrow">Already on the market</p>
          <p className="zoopla-discovery-title">
            Your next best investment could be right under your nose.
          </p>
          <p className="zoopla-discovery-description">
            Explore the potential in on-market property.
          </p>
          <a className="zoopla-discovery-link" href="/platform#role-investor">
            See how the Property Finder works <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
