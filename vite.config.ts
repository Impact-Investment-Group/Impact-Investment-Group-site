// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages build. Opt-in only: set STATIC_BUILD=true (see .github/workflows/deploy.yml).
// Everything below is inert for Lovable / Cloudflare builds, which stay SSR.
const isStaticBuild = process.env["STATIC_BUILD"] === "true";
// Project pages are served from https://<user>.github.io/<repo>/, so assets and
// the router need that prefix. Override with BASE_PATH for a custom domain.
const basePath = process.env["BASE_PATH"] ?? "/";

/**
 * The ten wait-list role pages, read off the same list the site renders from.
 *
 * ⚠️ NOT A SECOND HAND-KEPT COPY OF THE ROLE IDS. content/audiences.ts is the
 * one list; parsing it here means adding a role cannot leave a page that the
 * site links to but never prerenders. It is parsed rather than imported
 * because this config is loaded by Vite before any TypeScript path alias or
 * transform exists, so `import ... from "@/content/audiences"` cannot resolve.
 * Resolved off process.cwd() and NOT off import.meta.url: Vite bundles this
 * config into node_modules/.vite-temp before running it, so import.meta.url
 * points at that temp directory rather than at the repo.
 */
const ROLES_FILE = resolve(process.cwd(), "src/content/audiences.ts");

const registerRolePaths: string[] = (() => {
  const source = readFileSync(ROLES_FILE, "utf8");
  const marker = "export const registerRoles";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`vite.config.ts could not find ${marker} in ${ROLES_FILE}.`);
  }
  // ⚠️ BOUNDED AT THE END OF THE ARRAY, not at the end of the file. The first
  // cut of this read to EOF and swept up `pillarCards` below it, so the
  // prerenderer went looking for /register/homes, /register/support and
  // /register/lives, found nothing, and retried each one before dropping it.
  // The build still passed, which is exactly why this is written down.
  const end = source.indexOf("\n];", start);
  if (end === -1) {
    throw new Error(`vite.config.ts could not find the end of ${marker} in ${ROLES_FILE}.`);
  }
  const block = source.slice(start, end);
  const ids = [...block.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (ids.length === 0) {
    throw new Error(`vite.config.ts found no role ids in ${ROLES_FILE}.`);
  }
  return ids.map((id) => `/register/${id}`);
})();

export default defineConfig({
  ...(isStaticBuild
    ? {
        vite: {
          base: basePath,
          // The prerenderer boots `vite preview`; pin it to IPv4 loopback so it
          // works on CI runners without an IPv6 stack.
          preview: { host: "127.0.0.1" },
        },
        // No server to deploy on Pages — skip the Nitro/Cloudflare bundle so the
        // build emits plain client output that the prerenderer can fill in.
        nitro: false,
      }
    : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(isStaticBuild
      ? {
          prerender: {
            enabled: true,
            crawlLinks: true,
            // Query variants share one file on Pages. Keep the canonical HTML
            // so a crawled enquiry cannot overwrite the default contact form.
            filter: (page: { path: string }) => {
              const url = new URL(page.path, "https://impactinvestmentgroup.co.uk");
              return !url.search;
            },
            autoSubfolderIndex: true,
            failOnError: true,
            retryCount: 2,
          },
          pages: [
            { path: "/", prerender: { enabled: true } },
            { path: "/the-problem", prerender: { enabled: true } },
            { path: "/solutions", prerender: { enabled: true } },
            { path: "/platform", prerender: { enabled: true } },
            { path: "/about", prerender: { enabled: true } },
            { path: "/contact", prerender: { enabled: true } },
            { path: "/faqs", prerender: { enabled: true } },
            { path: "/pricing", prerender: { enabled: true } },
            // The company-information page the footer's `Legal` link opens.
            // Listed explicitly rather than left to `crawlLinks`: it is a
            // legal disclosure, and it has to exist as static HTML whether or
            // not a crawl happens to reach it. (Wave 298, R298-2.)
            { path: "/legal", prerender: { enabled: true } },
            // Wave 295, the wait list. The picker plus one page per role.
            // crawlLinks would reach the ten role pages from the picker and
            // from the hero anyway, but they are listed explicitly because
            // failOnError only protects a page the prerenderer knows about:
            // a role that fell out of the crawl would ship as a client-side
            // route with no HTML and no error, which is exactly the failure
            // this list exists to catch.
            { path: "/register", prerender: { enabled: true } },
            ...registerRolePaths.map((path) => ({ path, prerender: { enabled: true } })),
          ],
        }
      : {}),
  },
});
