import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { partnerProfiles } from "@/content/partners";
import { registerRoleIds } from "@/content/register";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/the-problem", changefreq: "monthly", priority: "0.8" },
          { path: "/solutions", changefreq: "monthly", priority: "0.9" },
          { path: "/platform", changefreq: "monthly", priority: "0.9" },
          { path: "/pricing", changefreq: "monthly", priority: "0.8" },
          { path: "/about", changefreq: "yearly", priority: "0.6" },
          { path: "/partners", changefreq: "monthly", priority: "0.9" },
          ...partnerProfiles.map((partner) => ({
            path: partner.path,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          { path: "/contact", changefreq: "yearly", priority: "0.7" },
          // The company-information page. Low priority, but it is indexed on
          // purpose: a reader checking who runs this site should be able to
          // find it from a search engine, not only from the footer.
          //
          // ⚠ NOTHING IN THIS FILE CURRENTLY REACHES A READER. It is a server
          // handler and the GitHub Pages build sets `nitro: false`, so no
          // sitemap.xml is emitted and robots.txt names none; `BASE_URL` above
          // is also still "", which would make every <loc> relative and
          // invalid. Pre-existing, measured in wave 298, reported there.
          { path: "/legal", changefreq: "yearly", priority: "0.3" },
          // The wait list. The picker outranks the ten role pages because it
          // is the one somebody arrives on; the role pages are what they land
          // on next, and each is worth indexing in its own right.
          { path: "/register", changefreq: "monthly", priority: "0.9" },
          ...registerRoleIds.map((id) => ({
            path: `/register/${id}`,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
