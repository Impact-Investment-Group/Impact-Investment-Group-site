import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Brand buttons.
 *
 * primary   the ONE orange action a page exists to get. Never two different
 *           primary actions on the same page.
 * secondary teal outline. Everything that is not the page's goal.
 * ghost     text with an animated teal underline.
 *
 * Every label and every rule below is measured against the LIGHT ground the
 * site has had since wave 412. A variant added here is measured too.
 */
const buttonVariants = cva(
  /* WAVE 413: `press`. A pressed control must never look the same as an
     unpressed one, and on a touchscreen the press is the ONLY feedback there
     is, because there was no hover state beforehand to have said anything.
     0.98 for 80ms, from :active, so it costs nothing, cannot get stuck, and
     fires for Enter and Space exactly as it does for a finger. See the rule
     in styles.css for why the lift can be 200ms and the press 80ms when both
     of them look like the transform. */
  "brand-button press group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-heading text-base font-semibold transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Flat orange-600 fill, never orange-500: white on 500 is 4.23:1 and
           passes for large text only, white on 600 is 5.34:1 and passes at
           any size (wave 295, the platform's orange; it was 2.6 and 3.4).
           Hover lifts and deepens the shadow rather than lightening the fill. */
        primary:
          /* WAVE 413: the lift is 1px, not 2px, and it answers to the keyboard
             as well as the pointer. On a filled pill the deepening shadow is
             what reads as the lift; 2px of travel on top of it made the button
             look like it was jumping away from the line of text beside it. */
          "rounded-full bg-orange-600 px-6 text-white shadow-[var(--shadow-action)] hover:-translate-y-px hover:shadow-[0_16px_34px_-12px_var(--color-orange-500)] focus-visible:-translate-y-px focus-visible:shadow-[0_16px_34px_-12px_var(--color-orange-500)]",
        /* WAVE 412, the light ground. The outline was teal-500 with a
           teal-400 label and a teal-950 fill on hover, all three of which were
           chosen against navy: on white the label is 2.41:1 and the hover
           fill is a black hole in the middle of a light page. It is now
           teal-600 throughout (5.14:1 on white, 4.89:1 on the band at wave
           777's values) filling
           to the 12% teal tint, which is the same tint the data icon plates
           use, so a secondary action and a data icon read as one family.
           WAVE 777: the hover fills to `bg-secondary`, the platform's pale
           teal bed, instead. Under the lifted teal the label on the 12% tint
           is 4.39:1 over white and 4.18:1 over the band; on the bed it is
           4.66:1 over any ground, because the bed is opaque. */
        secondary:
          "rounded-full border border-teal-600 bg-transparent px-6 text-teal-600 hover:bg-secondary hover:text-teal-600",
        ghost: "nav-underline rounded-none bg-transparent px-1 text-ink hover:text-teal-600",
        // shadcn-internal variants, retained for library components
        default: "rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90",
        destructive:
          "rounded-md bg-destructive px-4 text-destructive-foreground hover:bg-destructive/90",
        outline: "rounded-md border border-rule bg-transparent px-4 text-ink hover:bg-page-alt",
        link: "text-teal-600 underline-offset-4 hover:underline",
      },
      size: {
        /* Every button label stays at 16px / weight 600 minimum. White on
           orange-600 is 5.34:1 since wave 295 and no longer depends on the
           size, but a primary action is not a small control. Never shrink
           these, including on mobile. */
        default: "min-h-11 px-6 text-base",
        sm: "min-h-11 px-4 text-base",
        lg: "min-h-[52px] px-8 text-base",
        icon: "min-h-11 min-w-11 px-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Adds the sliding ArrowRight used on primary actions. */
  withArrow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, withArrow, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const showArrow = withArrow ?? variant === "primary";
    const arrow = showArrow ? (
      <ArrowRight
        aria-hidden="true"
        /* 3px. Far enough to read as "this goes somewhere", short enough that
           the gap beside the label does not open up and re-close. The
           focus-visible arm is the point rather than a bonus: an arrow that
           only moves for a mouse tells a keyboard user nothing. */
        className="transition-transform duration-200 ease-out group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]"
      />
    ) : null;

    // In asChild mode Slot accepts exactly one child, so the arrow is appended
    // inside that child rather than beside it.
    const content =
      asChild && arrow && React.isValidElement<{ children?: React.ReactNode }>(children)
        ? React.cloneElement(children, undefined, children.props.children, arrow)
        : children;

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {asChild ? (
          content
        ) : (
          <>
            {children}
            {arrow}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
