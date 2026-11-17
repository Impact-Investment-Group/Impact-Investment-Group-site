import type * as React from "react";

/** A plain left click, which a page may take over; anything else is left to the browser. */
export function isPlainClick(event: React.MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
