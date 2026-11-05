# Wave 1005: friendly animation and transparent pricing

Israel asked for more animation across the public website and a pricing page showing pricing as coming soon while making transparency clear.

## What changed

- Role glyphs give a short greeting on hover or keyboard focus. Buttons and exploration links have a directional arrow response; photographs lift slightly; partner cards, service choices, charity controls and step numbers respond to interaction. FAQ answers enter gently when opened. Touch retains press feedback and native disclosures.
- A shared observer gives below-fold headings and selected visual elements a brief arrival when they actually enter view, including after the page has been open for a while. Nothing is hidden to await an animation, and content already on screen remains static at hydration. No scroll handler, pointer tracking, continuous frame loop or animation dependency was added. Reduced motion remains supported.
- `/pricing` is a static public route with metadata and desktop/mobile navigation plus footer links. It says `Coming soon`, explains that pricing will be transparent, and uses a small interactive paper panel for prices, inclusions and additional costs. The disclosures work without JavaScript. Actions lead to the existing Contact and Our Services pages.
- No prices, tiers, billing periods, discounts, launch dates or payment features were invented. The new copy is confined to the requested pricing page and its navigation label. Existing photography, team headshots, colours, role guides, charity and email addresses are preserved.

## Verification and boundaries

All builds and browser checks run in GitHub Actions. The new journey checks cover four widths, pricing navigation, keyboard disclosures, no-JavaScript content, reduced motion, short entrance/hover animations, zero idle scrolling callbacks and a homepage JavaScript guard based on wave 1003. Existing whole-site, FAQ, ecosystem, Firefox/WebKit and rendered-colour gates remain; pricing joins the page and visual inventories.

Final run, measurements, screenshot review and public verification are recorded in Context Library `Platform/Live-State.md` and local `05-Artifacts/website-motion-pricing-2026-11-05/`. Browser sizes are emulation, not physical-device certification. The legacy server sitemap registry includes the new route; that endpoint is not emitted by the existing static build. Navigation and prerendered HTML make Pricing discoverable independently.

The existing isolated site worktree was reused. One delegated lane authored only the pricing route, content and style; shared motion, integration and verification stayed with the main agent. The parked platform checkout and signed-in application were not changed. `scripts/whats_building.py` was absent from the parked checkout; the current Landing-Queue, remote branches and Actions were read directly instead.

No user-facing string added or changed beyond those this brief specifies.
