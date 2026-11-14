import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";

import { Logo, LOGO_HOME_NAME } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { partnerSummaries } from "@/content/partner-summaries";
import { primaryNav, registerRoute } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The platform itself is not open yet, so "Log in" lands on the same
 * registration route until a real sign-in destination exists.
 */
/* WAVE 838 (Callum, 1 Nov 2026): "Log in" goes to the platform's own sign-in,
   where an investor, an agent or a co-sourcer signs in and a co-sourcer can
   also join. Until this wave it opened the site's wait-list enquiry form. */
const platformLoginUrl = "https://app.impactinvestmentgroup.co.uk/login";

/**
 * ── WAVE 413: THE HEADER GETS OUT OF THE WAY ──────────────────────────────
 *
 * Two pieces of motion here, and each one is a job rather than a flourish.
 *
 * THE CONDENSE. Past 24px of scroll the logo scales to 0.85 from its left
 * edge and the card shadow appears, so the bar visibly tightens under the
 * page. It relaxes again when they scroll back up, because scrolling up is
 * what someone does when they are looking for the navigation.
 *
 * ⚠ WAVE 414: THE BAR'S HEIGHT IS NO LONGER PART OF THIS. Wave 413 animated
 * it from 72px to 56px to hand 16px of viewport back, and that was a 200ms
 * relayout of the whole document on every crossing: measured on the 4x-slowed
 * phone profile it cost the home page up to 50.10ms inside a 16.7ms frame, 53
 * to 56 dropped frames per scroll. The bar has one static height now, 56px on
 * a phone and 72px from 640px, so the 16px arrives on the first paint and is
 * never taken away again, and the two things this file still changes on a
 * condense are a transform and a shadow. `styles.css` above `.site-header`
 * carries the measurements. Everything here is transform and opacity.
 *
 * THE MAGIC LINE. One underline that slides between the nav links on hover and
 * on keyboard focus, and settles on the active route whenever nothing is being
 * pointed at. It answers "where am I" continuously rather than only at rest,
 * and because it is one element travelling rather than six fading in and out,
 * the eye follows it.
 *
 * ⚠ IT ONLY EXISTS ONCE IT HAS BEEN MEASURED. The server cannot measure a
 * link's width, so the prerendered HTML carries no magic line at all and the
 * per-link `nav-link` underline in styles.css does the work. The moment the
 * client measures, `data-magic="on"` goes on the list, which is what turns the
 * per-link underlines off. Without JavaScript the navigation keeps its
 * underline and its orange active route exactly as before.
 */

/** The drawer's id, so the trigger can name what it controls. */
const DRAWER_ID = "site-drawer";
/** Scroll depth, in px, at which the bar condenses. */
const CONDENSE_AT = 24;
/** Upward travel, in px, that expands it again. Enough not to flutter. */
const EXPAND_AFTER_UP = 24;

interface MagicLine {
  left: number;
  width: number;
}

export function SiteHeader() {
  const [condensed, setCondensed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [partnersOpen, setPartnersOpen] = React.useState(false);
  const [mobilePartnersOpen, setMobilePartnersOpen] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const partnersCloseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const navRef = React.useRef<HTMLUListElement | null>(null);
  const [magic, setMagic] = React.useState<MagicLine | null>(null);
  /** The link the pointer or the keyboard is on, or null for "the active one". */
  const hovered = React.useRef<HTMLElement | null>(null);

  const openPartnersMenu = () => {
    if (partnersCloseTimerRef.current) clearTimeout(partnersCloseTimerRef.current);
    setPartnersOpen(true);
  };

  const schedulePartnersMenuClose = () => {
    if (partnersCloseTimerRef.current) clearTimeout(partnersCloseTimerRef.current);
    partnersCloseTimerRef.current = setTimeout(() => setPartnersOpen(false), 220);
  };

  React.useEffect(() => {
    // WAVE 412: the header is light on every route, so it no longer has to
    // ask what is under it. The probe that used to run here read
    // elementFromPoint on every scroll frame to decide whether to draw a rule;
    // the rule is now always there.
    //
    // WAVE 413: and the only work this listener does is compare two numbers
    // and, at most, flip one boolean. Everything expensive is CSS.
    let last = window.scrollY;
    let climbed = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;
      if (delta < 0) climbed -= delta;
      else if (delta > 0) climbed = 0;

      if (y <= CONDENSE_AT) {
        setCondensed(false);
        return;
      }
      if (delta > 0) {
        climbed = 0;
        setCondensed(true);
      } else if (climbed >= EXPAND_AFTER_UP) {
        setCondensed(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /**
   * Where the magic line rests: under the active route, or nowhere if the
   * visitor is on a route the navigation does not list (/legal, /register).
   * Measured against the list's own box, so it travels in the list's space.
   */
  const settleMagic = React.useCallback(() => {
    const list = navRef.current;
    if (!list) return;
    const target =
      hovered.current ?? list.querySelector<HTMLElement>('[data-nav-link][data-nav-active="true"]');
    if (!target) {
      setMagic(null);
      return;
    }
    const listBox = list.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setMagic({ left: box.left - listBox.left, width: box.width });
  }, []);

  // Re-measure when the route changes (the active link moves), when the bar
  // condenses (the list moves with it), and when the window is resized.
  React.useEffect(() => {
    hovered.current = null;
    settleMagic();
  }, [pathname, condensed, settleMagic]);

  React.useEffect(() => {
    const onResize = () => settleMagic();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [settleMagic]);

  const pointMagicAt = (element: HTMLElement | null) => {
    hovered.current = element;
    settleMagic();
  };

  // Close on route change.
  React.useEffect(() => {
    setOpen(false);
    setPartnersOpen(false);
    setMobilePartnersOpen(false);
  }, [pathname]);

  React.useEffect(
    () => () => {
      if (partnersCloseTimerRef.current) clearTimeout(partnersCloseTimerRef.current);
    },
    [],
  );

  // Focus trap + escape while the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    /*
     * BOTH ELEMENTS, AND THE PREVIOUS VALUES PUT BACK RATHER THAN BLANKED.
     *
     * ⚠ TO BE CLEAR ABOUT WHAT WAS AND WAS NOT WRONG: `overflow: hidden` on
     * <body> alone DOES lock this page today, and wave 413 measured that
     * rather than assuming it. The used overflow of the root box propagates to
     * the viewport, and when <html> is `visible` it is <body>'s that
     * propagates instead. Body alone works only for as long as nobody gives
     * <html> an overflow of its own, which is one stylesheet rule away and
     * would fail silently, with the page sliding around behind an open drawer
     * and no test able to see it. Saying it on both is the version that does
     * not depend on a condition nothing enforces.
     *
     * The restore is the other half. `= ""` assumed these were empty before
     * the drawer opened; capturing and replacing them means another component
     * that owns one of these can keep owning it.
     *
     * ⚠ AND `overflow: hidden` DOES NOT STOP `scrollTo`. It stops the visitor,
     * not the script, which is the right behaviour and is also how the first
     * draft of the drawer probe managed to report a 369px scroll behind a
     * drawer that was locked correctly. The probe uses a real wheel event now.
     */
    const root = document.documentElement;
    const previous = { root: root.style.overflow, body: document.body.style.overflow };
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    // Opening the overflow-locked drawer must also retain the reading position.
    focusables()[0]?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        // The overflow lock is still applied until this effect cleans up.
        // Focusing the sticky header must not scroll to its document position.
        triggerRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previous.root;
      document.body.style.overflow = previous.body;
    };
  }, [open]);

  const partnersActive = pathname === "/partners" || pathname.startsWith("/partner-with-");

  return (
    <>
      {/*
       * WAVE 412: A LIGHT HEADER.
       *
       * Desktop keeps the translucent header. Below the desktop navigation
       * breakpoint the same light bar is opaque, avoiding a backdrop repaint
       * on every phone or tablet scroll frame.
       *
       * The rule underneath is permanent. It is the only thing separating a
       * white bar from a white page, so it cannot be a scroll state.
       */}
      <header
        data-condensed={condensed ? "true" : "false"}
        className={cn(
          "site-header sticky top-0 z-50 border-b border-rule bg-page xl:bg-header",
          "xl:supports-[backdrop-filter]:backdrop-blur-md",
          condensed && "shadow-[var(--shadow-card)]",
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="site-header__logo shrink-0 rounded-md"
            aria-label={LOGO_HOME_NAME}
          >
            <Logo variant="on-cream" />
          </Link>

          <nav aria-label="Main" className="hidden self-stretch xl:block">
            <ul
              ref={navRef}
              data-magic={magic ? "on" : undefined}
              onMouseLeave={() => pointMagicAt(null)}
              className="nav-magic relative flex h-full items-center gap-4 2xl:gap-6"
            >
              {primaryNav.map((item) => (
                <React.Fragment key={item.to}>
                  {item.to === "/partners" ? (
                    <li
                      className="flex h-full items-center"
                      onMouseEnter={openPartnersMenu}
                      onMouseLeave={schedulePartnersMenuClose}
                    >
                      <DropdownMenu
                        modal={false}
                        open={partnersOpen}
                        onOpenChange={setPartnersOpen}
                      >
                        <DropdownMenuTrigger asChild>
                          <Link
                            to="/partners"
                            data-nav-link=""
                            data-nav-active={partnersActive ? "true" : undefined}
                            onMouseEnter={(event) => pointMagicAt(event.currentTarget)}
                            onFocus={(event) => pointMagicAt(event.currentTarget)}
                            onBlur={() => pointMagicAt(null)}
                            className={cn(
                              "nav-link inline-flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap text-[15px] font-medium text-ink transition-colors duration-200",
                              /* orange-700, not 500: this is 15px TEXT on a
                               white bar, where 500 is 4.23:1 and 700 is
                               6.50:1. The underline under it stays 500,
                               because a 2px rule is a graphic and answers to
                               3:1 rather than 4.5:1. */
                              partnersActive && "text-orange-700",
                            )}
                          >
                            Partners
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-3.5 transition-transform duration-200 ease-[var(--ease-out-soft)]",
                                partnersOpen && "rotate-180",
                              )}
                            />
                          </Link>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          sideOffset={0}
                          onMouseEnter={openPartnersMenu}
                          onMouseLeave={schedulePartnersMenuClose}
                          className="partners-menu w-[720px] rounded-none border-x border-b border-t-2 border-x-rule border-b-rule border-t-orange-500 bg-page p-0 text-ink shadow-[var(--shadow-card-hover)]"
                        >
                          <div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                              Partners
                            </p>
                            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-soft">
                              10 partner pathways
                            </span>
                          </div>

                          <div className="grid grid-cols-[250px_1fr]">
                            <div className="flex min-h-[360px] flex-col bg-orange-600 p-6 text-white">
                              <p className="font-mono text-xs font-semibold uppercase tracking-[0.13em]">
                                One network
                              </p>
                              <div className="mt-auto">
                                <p className="font-heading text-[34px] font-extrabold leading-none">
                                  Find where you fit.
                                </p>
                                <p className="mt-3 max-w-[25ch] text-sm font-medium leading-relaxed">
                                  Explore each partner pathway or start with the full ecosystem.
                                </p>
                                <DropdownMenuItem
                                  asChild
                                  className="mt-5 cursor-pointer rounded-none p-0 text-page focus:bg-ink focus:text-page"
                                >
                                  {/* The one navy left on this bar, and it is
                                    deliberate: a navy button inside the orange
                                    feature block. White on navy-900 is
                                    18.83:1, and nothing lighter would separate
                                    from the orange behind it. */}
                                  <Link
                                    to="/partners"
                                    className="group flex min-h-12 w-full items-center gap-3 bg-ink px-4 py-3 text-page transition-colors hover:bg-navy-800"
                                  >
                                    <NetworkMark />
                                    <span className="text-[13px] font-semibold">
                                      Explore the ecosystem
                                    </span>
                                    <ArrowMark />
                                  </Link>
                                </DropdownMenuItem>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 content-start gap-0.5 p-3">
                              {partnerSummaries.map((partner, index) => (
                                <DropdownMenuItem
                                  key={partner.id}
                                  asChild
                                  className="cursor-pointer rounded-none p-0 focus:bg-page-alt focus:text-ink"
                                >
                                  <Link
                                    to={partner.path}
                                    className={cn(
                                      "group relative flex min-h-14 w-full items-center gap-2.5 px-3 py-2 text-sm font-semibold leading-tight text-ink-muted transition-colors hover:bg-page-alt hover:text-ink",
                                      pathname === partner.path &&
                                        "bg-page-alt text-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-orange-500",
                                    )}
                                  >
                                    <span className="w-5 shrink-0 font-mono text-xs text-orange-700">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span>{partner.label}</span>
                                    <ArrowMark />
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ) : null}
                  {item.to !== "/partners" ? (
                    <li>
                      <Link
                        to={item.to}
                        activeOptions={{ exact: true }}
                        data-nav-link=""
                        data-nav-active={pathname === item.to ? "true" : undefined}
                        onMouseEnter={(event) => pointMagicAt(event.currentTarget)}
                        onFocus={(event) => pointMagicAt(event.currentTarget)}
                        onBlur={() => pointMagicAt(null)}
                        className="nav-link inline-flex min-h-11 items-center whitespace-nowrap text-[15px] font-medium text-ink transition-colors duration-200"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ) : null}
                </React.Fragment>
              ))}

              {/* THE MAGIC LINE. Rendered only once it has been measured, so the
                prerendered HTML never carries an underline sitting at the
                wrong place, and a visitor with no JavaScript keeps the
                per-link one. aria-hidden because it says nothing the active
                link's own orange does not already say. */}
              {magic ? (
                <span
                  aria-hidden="true"
                  className="nav-magic__line"
                  /* WAVE 413b: translate AND scale, so the line travels and
                    stretches on transform alone. The rule is 1px wide in the
                    stylesheet, so `scaleX(n)` measures exactly n px. */
                  style={{
                    transform: `translateX(${magic.left}px) scaleX(${magic.width})`,
                  }}
                />
              ) : null}
            </ul>
          </nav>

          <div className="hidden items-center gap-5 xl:flex">
            <Button variant="primary" size="sm" asChild withArrow={false}>
              <Link to={registerRoute.to}>{registerRoute.label}</Link>
            </Button>
            <a
              href={platformLoginUrl}
              className="nav-underline inline-flex min-h-11 items-center whitespace-nowrap text-[15px] font-normal text-ink transition-colors duration-200 hover:text-orange-700"
            >
              Log in
            </a>
          </div>

          {/* WAVE 413b: `aria-controls` as well as `aria-expanded`. The pair
            is what tells a screen reader that this button owns the thing that
            just appeared; the drawer's own Partners toggle has carried both
            since wave 413 and this one had only half. */}
          <button
            ref={triggerRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={DRAWER_ID}
            onClick={() => setOpen((v) => !v)}
            className="press inline-grid size-11 cursor-pointer place-items-center rounded-full border border-rule text-ink transition-colors duration-200 hover:bg-page-alt xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/*
       * ⚠ THE DRAWER LIVES OUTSIDE <header>, AND IT HAS TO.
       *
       * The bar carries `backdrop-filter: blur` (wave 412, so the page
       * reads through it as it scrolls). An element with a backdrop-filter
       * becomes the CONTAINING BLOCK for every `position: fixed`
       * descendant, exactly as `filter` does. So a fixed drawer inside the
       * header is not fixed to the viewport at all: it is fixed to a 72px
       * bar, and `inset-y-0` makes it 72px tall.
       *
       * That is what it shipped as for one commit of this wave. The scrim
       * covered the header and nothing else, and the panel was a 72px strip
       * with the whole menu spilling out of it over the page. Every probe
       * passed: it opened, it trapped focus, it locked the scroll and it
       * closed on Escape. It was the SCREENSHOT that showed it, which is why
       * the drawer probe now measures the panel's height and the scrim's
       * coverage against the viewport as well.
       */}
      {/* ── THE DRAWER ──────────────────────────────────────────────────────
        A panel from the right rather than a sheet over the whole screen.
        The page stays visible behind it, dimmed, so the visitor can see they
        have opened something on top of what they were reading rather than
        gone somewhere new, and the backdrop is then a place to press to get
        back. Escape does the same, focus is trapped inside, the body cannot
        scroll underneath, and a route change closes it.

        It is rendered only while open, so nothing here is ever an invisible
        element waiting for a trigger. */}
      {open ? (
        <>
          {/* The backdrop is a real press target and NOT an announced control:
            it duplicates the close button beside the logo, and a second
            "Close menu" in the accessibility tree is noise, not help. Escape
            and that button are the keyboard paths.

            ⚠ WAVE 413b: A <div>, NOT AN aria-hidden <button>. `tabIndex={-1}`
            kept it off the tab order, so it was never an `aria-hidden-focus`
            violation, but a <button> inside `aria-hidden="true"` is the exact
            shape axe returns as INCOMPLETE and a human then has to adjudicate.
            A div with an onClick says the same thing to a pointer and nothing
            at all to the accessibility tree, which is what was wanted.

            ⚠ WAVE 414 (rel413b MIN-6): and it SAYS so now rather than
            leaving it to be inferred. A plain <div> with no role is already
            ignored by a screen reader, but "already ignored" is a deduction
            from an absence, and the next person to give this element a child
            with text in it would not know that was load-bearing.
            `aria-hidden="true"` states it. Nothing focusable is inside, so
            this cannot become the `aria-hidden-focus` violation the <button>
            version was. It stays POINTER-ONLY on purpose: Escape and the
            Close control beside the logo are the keyboard paths, and a second
            "Close menu" in the tree is noise rather than help. Wave 414's
            drawer probe step presses it at 390 and asserts the panel goes.

            ⚠ AND IT IS ABOVE THE HEADER NOW. It shipped at z-40 under a z-50
            bar, so the top of the screen stayed undimmed white with a live
            logo link in it while everything below was at 40%: the one thing
            on the page a pointer could still reach behind an open menu. The
            backdrop is z-50 and comes after </header> in source order, so it
            paints over the bar; the panel is z-[60] and stays over both. */}
          <div
            aria-hidden="true"
            onClick={() => {
              setOpen(false);
              triggerRef.current?.focus({ preventScroll: true });
            }}
            className="drawer-scrim fixed inset-0 z-50 cursor-pointer bg-ink/40 xl:hidden"
          />
          <div
            id={DRAWER_ID}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="drawer-panel fixed inset-y-0 right-0 z-[60] flex w-[min(21rem,88vw)] flex-col border-l border-rule bg-page px-5 pb-8 pt-6 shadow-[var(--shadow-card-hover)] xl:hidden"
          >
            <div className="flex items-center justify-between">
              <Logo variant="on-cream" size="panel" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus({ preventScroll: true });
                }}
                className="press inline-grid size-11 cursor-pointer place-items-center rounded-full border border-rule text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav aria-label="Mobile" className="mt-8 min-h-0 flex-1 overflow-y-auto py-4">
              <ul className="flex flex-col gap-6">
                {primaryNav.map((item, index) => (
                  <React.Fragment key={item.to}>
                    {item.to === "/partners" ? (
                      <li className="drawer-item" style={stagger(index)}>
                        <button
                          type="button"
                          aria-expanded={mobilePartnersOpen}
                          aria-controls="mobile-partner-links"
                          onClick={() => setMobilePartnersOpen((value) => !value)}
                          className={cn(
                            "flex w-full items-center justify-between font-heading text-[26px] font-semibold text-ink",
                            partnersActive && "text-orange-700",
                          )}
                        >
                          Partners
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              "size-5 transition-transform duration-200 ease-[var(--ease-out-soft)]",
                              mobilePartnersOpen && "rotate-180",
                            )}
                          />
                        </button>
                        {/* The same orange rule the desktop bar uses for the
                          route you are on, so the two read as one site. */}
                        {partnersActive ? (
                          <span
                            aria-hidden="true"
                            className="mt-2 block h-0.5 w-10 bg-orange-500"
                          />
                        ) : null}
                        {mobilePartnersOpen ? (
                          <ol
                            id="mobile-partner-links"
                            className="mt-4 grid gap-1 border-l border-teal-600/35 pl-4"
                          >
                            <li>
                              <Link
                                to="/partners"
                                className="flex min-h-11 items-center gap-3 rounded-none px-2 text-[15px] font-semibold text-ink hover:bg-page-alt"
                              >
                                <NetworkMark />
                                Explore the ecosystem
                              </Link>
                            </li>
                            {partnerSummaries.map((partner, partnerIndex) => (
                              <li key={partner.id}>
                                <Link
                                  to={partner.path}
                                  className="flex min-h-11 items-center gap-3 rounded-none px-2 text-[15px] font-semibold text-ink-muted hover:bg-page-alt hover:text-ink"
                                >
                                  <span className="font-mono text-[10px] max-lg:text-[12px] text-orange-700">
                                    {String(partnerIndex + 1).padStart(2, "0")}
                                  </span>
                                  {partner.label}
                                </Link>
                              </li>
                            ))}
                          </ol>
                        ) : null}
                      </li>
                    ) : null}
                    {item.to !== "/partners" ? (
                      <li className="drawer-item" style={stagger(index)}>
                        <Link
                          to={item.to}
                          activeOptions={{ exact: true }}
                          className="font-heading text-[26px] font-semibold text-ink data-[status=active]:text-orange-700"
                        >
                          {item.label}
                        </Link>
                        {pathname === item.to ? (
                          <span
                            aria-hidden="true"
                            className="mt-2 block h-0.5 w-10 bg-orange-500"
                          />
                        ) : null}
                      </li>
                    ) : null}
                  </React.Fragment>
                ))}
              </ul>
            </nav>

            <div
              className="drawer-item flex flex-col items-center gap-5"
              style={stagger(primaryNav.length)}
            >
              <Button variant="primary" asChild className="w-full" withArrow={false}>
                <Link to={registerRoute.to}>{registerRoute.label}</Link>
              </Button>
              <a
                href={platformLoginUrl}
                className="inline-flex min-h-11 items-center text-[15px] font-normal text-ink"
              >
                Log in
              </a>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/** 30ms between drawer items, so the list reads as one thing arriving. */
function stagger(index: number): React.CSSProperties {
  return { "--drawer-delay": `${index * 30}ms` } as React.CSSProperties;
}

function ArrowMark() {
  return (
    <span aria-hidden="true" className="ml-auto text-[13px] text-teal-600">
      →
    </span>
  );
}

function NetworkMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-5 place-items-center border border-teal-600/45 text-xs text-teal-600"
    >
      10
    </span>
  );
}
