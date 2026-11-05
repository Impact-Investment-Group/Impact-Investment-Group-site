import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
/**
 * ── WAVE 414: THE THREE FONTS THAT PAINT THE FIRST SCREEN, PRELOADED ────
 *
 * Imported for their URLs, not for their contents: `?url` gives the hashed
 * path Vite emitted, so the preload cannot go stale when the build rehashes
 * them, which a hand-typed `/assets/barlow-latin-800-normal-s1sAMnoV.woff2`
 * would on the next build.
 *
 * Without this a font is discovered only once the stylesheet has been fetched
 * AND parsed, which on a slow connection is a whole round trip after the
 * HTML. The browser paints the fallback, the font lands, and everything
 * reflows. Wave 414's metric-matched fallback faces (see `styles.css` above
 * `@theme`) make that reflow cheap; this makes it less likely to happen.
 *
 * THREE, NOT FIVE. Barlow 800 is the hero's headline, Barlow 700 is every
 * section heading and Inter is the body. Barlow 600 and JetBrains Mono are
 * below the fold on every route and are left to be discovered normally: a
 * preload for something that is not needed immediately competes with the
 * things that are, which is the usual way this goes wrong.
 */
import barlow700 from "@fontsource/barlow/files/barlow-latin-700-normal.woff2?url";
import barlow800 from "@fontsource/barlow/files/barlow-latin-800-normal.woff2?url";
import interVariable from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ImageFade } from "@/components/image-fade";
import { BackToTop } from "@/components/ui/back-to-top";
import { PageOutline, ReadingProgress } from "@/components/page-outline";
import { siteDescription } from "@/content/site";

function NotFoundComponent() {
  return (
    <main id="main" className="page-intro flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm max-lg:text-[15px] text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-700"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm max-lg:text-[15px] text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-orange-700"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Impact Investment Group" },
      {
        name: "description",
        content: siteDescription,
      },
      { property: "og:site_name", content: "Impact Investment Group" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      /* Follows the HEADER ground, which is what sits under the browser's
         own bar. Navy here on a white header put a dark strip above the page
         on Android and in installed PWAs. */
      { name: "theme-color", content: "#FFFFFF" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      ...[barlow800, barlow700, interVariable].map((href) => ({
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href,
        // Fonts are fetched in CORS mode whatever the origin, so a preload
        // without this is a SECOND download rather than a head start.
        crossOrigin: "anonymous" as const,
      })),
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * ── WAVE 413: <main> ARRIVES, AND ONLY WHEN IT REALLY IS NEW ──────────────
 *
 * A client-side navigation on this site used to replace the whole page between
 * two frames with nothing to say it had happened. An 8px rise over 200ms is
 * the smallest thing that reads as "this is a different page" rather than as a
 * repaint, and it gives the scroll position a beat to land before the eye
 * starts reading.
 *
 * ⚠ IT MUST NOT RUN ON THE FIRST PAINT. Every route here is prerendered, so
 * the first thing a visitor sees is the server's HTML; running an entrance on
 * that is the wave 412b defect exactly (`rise-in` with a backwards fill
 * blinking away content already on the screen). `enter` starts at 0, the
 * attribute is absent, and the CSS matches nothing at all until the first
 * navigation.
 *
 * The two alternating values are how a CSS animation is restarted without
 * touching the DOM twice or forcing a reflow: the animation-name changes, so
 * the browser starts a new one.
 */
function useRouteEnter(): "a" | "b" | undefined {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  const [enter, setEnter] = useState(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setEnter((value) => value + 1);
  }, [pathname]);

  if (enter === 0) return undefined;
  return enter % 2 === 0 ? "a" : "b";
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routeEnter = useRouteEnter();

  return (
    <QueryClientProvider client={queryClient}>
      <ImageFade />
      <div className="flex min-h-screen flex-col bg-page">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:text-page focus:shadow-[var(--shadow-card-hover)]"
        >
          Skip to content
        </a>
        <SiteHeader />
        <ReadingProgress />
        <PageOutline />
        <main id="main" data-route-enter={routeEnter} className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <BackToTop />
    </QueryClientProvider>
  );
}
