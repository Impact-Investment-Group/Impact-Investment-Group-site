import { useEffect } from "react";
import { Heart, Home, PoundSterling } from "lucide-react";
import type { BuddyAction, BuddyExpression, BuddyForm } from "./buddy-character";
import { cn } from "@/lib/utils";

export type BuddyPlacement = "page" | "corner" | "chat";

/** A destination for the one root actor, never a second character renderer. */
export function BuddySlot({ form = "property", action = "idle", expression = "warm", kind = "page", className }: {
  form?: BuddyForm;
  action?: BuddyAction;
  expression?: BuddyExpression;
  kind?: BuddyPlacement;
  className?: string;
  animated?: boolean;
}) {
  useEffect(() => {
    window.dispatchEvent(new Event("iig:buddy-slots"));
    return () => { window.dispatchEvent(new Event("iig:buddy-slots")); };
  }, [form, action, expression, kind]);
  const Icon = form === "support" ? Heart : form === "investment" ? PoundSterling : Home;
  return <span aria-hidden="true" data-buddy-slot={kind} data-buddy-slot-form={form}
    data-buddy-slot-action={action} data-buddy-slot-expression={expression}
    className={cn("relative flex aspect-square w-full shrink-0 items-center justify-center", className)}>
    {kind === "page" && <Icon data-buddy-slot-fallback className="size-12 text-teal-600/40" strokeWidth={1.25} />}
  </span>;
}
