# Wave 1208 design review

Reviewed 10 to 11 November 2026. Scope: the public website, shared components and Buddy. This source-backed review does not certify the signed-in platform or claim CI or deployment success. Final verification belongs in `WAVE1208_REPORT.md`.

## Reference principles

The [Instagram reference](https://www.instagram.com/reel/Dfh24cUh4KF/) explains design terminology, rather than a website layout to reproduce. Seventeen numbered terms were observed. The final three were not captured and are not invented here. Five further terms appear in its caption. IIG's existing brand and factual content remain the implementation basis.

| Observed principle | Applied, retained or deliberately limited |
| --- | --- |
| 1. Kerning | Retain Barlow, Inter and browser shaping. No manual character-pair adjustments were justified. Typography: `src/styles.css`. |
| 2. Optical centre | Buddy has a reserved stage and icons have centred targets. Optical balance still requires visual QA; geometry alone does not prove it. `src/components/buddy/buddy-character.tsx`, `buddy-explorer.tsx`. |
| 3. Tabular numbers | Retain pricing/map numerals; use tabular topic and input counters. `src/components/pricing/pricing.css`, `src/components/home/demand-map.tsx`, Buddy components. |
| 4. Layout shift | Reserve the canvas and tallest topic panel. Preserve fixed header height, image dimensions and font fallbacks. `buddy-character.tsx`, `buddy-explorer.tsx`, `src/styles.css`. |
| 5. Tracking | Preserve heading/eyebrow hierarchy; Buddy headings use `tracking-tight`. Enlarge tiny navigation labels. `buddy-explorer.tsx`, `src/components/site-header.tsx`. |
| 6. Optimistic update | Show the submitted question immediately, with a pending state. Only display an assistant answer after a valid `used_ai: true` response. `buddy-assistant.tsx`. |
| 7. X-height | Retain Inter for reading and controls. Improve undersized menu text instead of changing fonts. `src/styles.css`, `site-header.tsx`. |
| 8. Touch target | Buddy controls and mobile partner links have at least 44px targets. Shared buttons already enforce this minimum. Buddy components, `site-header.tsx`, `src/components/ui/button.tsx`. |
| 9. Leading | Use relaxed spacing for explanations and replies, consistent with existing body rhythm. Buddy components, `src/experience.css`. |
| 10. Origin-aware animation | Chat enters from its bottom-corner placement, from below on phones. Existing menu/drawer motion remains. `buddy-assistant.tsx`, `src/styles.css`. |
| 11. OKLCH | Preserve approved colour values and existing OKLab mixtures. No unnecessary palette migration; OKLab mixing is not labelled OKLCH. `src/styles.css` `@theme`. |
| 12. Widow | Balanced headings and pretty paragraph wrapping reduce stranded words. Retain global heading wrapping. `src/experience.css`, `buddy-explorer.tsx`. |
| 13. Safe area | Launcher/composer use bottom safe-area insets; dialog uses the dynamic viewport. Existing mobile allowances remain. `buddy-assistant.tsx`, `src/styles.css`. |
| 14. Stagger | Retain small entrance and drawer staggers. Topic sentences appear together for immediate reading. `src/components/site-motion.tsx`, `src/components/ui/reveal.tsx`, `site-header.tsx`. |
| 15. Line length | Retain the 64-character reading measure; constrain explanation and conversation widths. `src/experience.css`, Buddy components. |
| 16. Affordance | Label topics, selected states, retry/cancel and destinations; restore focus on close. Preserve still informational cards. Buddy components, `src/experience.css`. |
| 17. Combobox | Retain useful search and native role selectors. A custom combobox adds little to short lists. `src/components/partners/partners-hub.tsx`, `src/routes/faqs.tsx`, `src/components/services/platform-guides.tsx`. |
| Caption: orphan | Use readable measures and balanced/pretty wrapping. No print-style orphan-control claim for continuous web content. |
| Caption: tinted neutral | Reuse semantic `page-alt`, `secondary`, `rule` and brand tints. `src/styles.css`, Buddy components. |
| Caption: skeleton | Pending chat combines restrained placeholder lines with a real status. Artwork has a topic-icon fallback; map skeleton remains. Buddy components, `src/styles.css`. |
| Caption: ease-out | Short UI transitions use ease-out; character gestures settle and stop. Buddy components, existing motion tokens. |
| Caption: empty state | Offer a relevant starter question; failures offer retry and destinations. Preserve FAQ/partner no-result states. `buddy-assistant.tsx`, FAQs and Partners. |

## Implementation

Tailwind v4 and its Vite plugin already existed. New Buddy interfaces use Tailwind utilities and the existing semantic theme. Large legacy CSS families remain; unrelated pages were not rewritten simply to remove CSS.

The homepage introduces one Buddy with property, investment and support topics. Selecting a topic transforms the same character, explains the corresponding service and links to an actual destination. Keyboard controls, selected states and reserved panel geometry support this interaction.

The supplied atlas and articulated renderer animate the key, pound-sign and heart forms. The transformation includes a body-artwork change during the supplied transition; it is not geometric vector morphing. Gestures are bounded, pause off-screen, respect reduced motion and clean up on unmount. Secondary illustrations are stills. Public renderers and identity copy no longer present the old trio. Calculations are attributed to platform tools; Buddy guides and explains.

The shared conversation panel has transient history, bounded input, pending/cancel/retry states, source links and honest failures. It calls the public Buddy endpoint, not the authenticated private assistant. Live model operation requires separate backend evidence.

## Route-family review

| Family | Changed or retained | Further opportunity, not implemented here |
| --- | --- | --- |
| Home | Added Buddy; retained photo hero, mission controls, sourced evidence, demand illustration and FAQs. `src/routes/index.tsx`, `src/components/home/`. | Observe whether visitors identify the right next step; tune topic order from actual use. |
| Services | One Buddy in hero/tool explorer; retained real role screenshots and walkthroughs. `src/routes/platform.tsx`, `src/components/services/`. | Refresh screenshots with product changes; deeper demos only for real functionality. |
| Pricing | Added section navigation; retained packages, formulas, validation, worked example and no-JavaScript guidance. `src/components/pricing/`, `page-outline.tsx`. | Consider an accessible comparison view if users struggle to compare packages. |
| About | Preserved people and company responsibilities; replaced collective mascot art and removed repeated trio decoration. `src/routes/about.tsx`. | A selectable responsibility diagram could clarify handoffs without conflating companies. |
| Problem/Solutions | Replaced old evidence-page characters; retained citations, tables and selectable solution layers. Corresponding route files. | Add detail where it clarifies sourced figures; avoid effects implying live data. |
| Partners/role pages | Replaced trio compositions; retained search, filters, ecosystem, keyboard journeys and diagram viewer. `src/components/partners/`. | Assess search vocabulary and whether a guided role chooser is needed. |
| Contact | Replaced illustration; retained enquiry choices, draft behaviour and contact destinations. `src/components/contact/`. | Keep any future chat-to-team handoff explicit; no silent enquiry submission. |
| FAQs | Added section links; retained search, native disclosures and reviewed-question workflow. `src/routes/faqs.tsx`, `src/components/faq/`. | Use recurring questions to improve reviewed answers; no automatic AI publication. |
| Registration | Replaced artwork; retained role choice, validation and consent/account flow. `src/routes/register.index.tsx`, `src/components/register/`. | Measure step-level difficulties before restructuring the journey. |
| Navigation/legal | Enlarged small menu labels and mobile targets; retained focus, skip link, footer and legal documents. `site-header.tsx`, `page-outline.tsx`, `src/routes/legal.tsx`. | Continue migrating touched controls into shared Tailwind primitives. |

## Remaining scope and verification

The signed-in platform's design was not changed. Future candidates include Buddy beside property figures, guided acquisition steps, clearer demand-map legends/layer status, and management-dashboard triage. Each needs its own source/UI review, role permissions and data contracts. These are opportunities, not newly proven defects or completed work.

`scripts/site-buddy.py` specifies keyboard, single-canvas transformation, rendered-artwork, request/history, AI-proof, retry, cancellation, focus, reduced-motion, fallback and phone-layout checks. Existing all-page checks positively assert Buddy and reject retired identities. Browser AI responses are deterministic fixtures and cannot prove live Gemma availability. No local tests, builds or executable audits were run for this review. CI results, visual captures, live AI evidence and publication status must be read from the final wave report.
