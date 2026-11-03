# Wave 921: public role ecosystem

Israel requested a simple mind map with Impact Investment Group in the centre and each user role connected to it. The Partners page is the existing public explanation of those relationships, so the map sits between its introduction and searchable directory. The introduction's ecosystem link now reaches the map; the directory remains directly reachable underneath.

The map includes the ten published partner profiles plus Co-sourcer, which is a public registration role with its own platform sign-up. Role labels, summaries, steps and destinations come from the existing content sources. Internal platform roles are not invented as marketing roles. Management Agents are mentioned in the landlord profile's relationships but are not a public registration option on this website.

Every role is a native button opening a Radix dialog. The dialog presents the existing relationship description and three platform steps, with the current role page as its next action. Co-sourcer uses its existing "Source homes with us" wording and registration URL. Dialogs support Escape, trapped focus and return to the originating node. Connections highlight on focus or pointer interaction; no continuous animation or drag gesture is required. On small screens the captions yield to larger labels and the dialog carries the full explanation.

The central company is text and a Lucide network icon, not a replacement logo. Brand tokens supply all colours. No photo, headshot, factual source text, registration endpoint or account behaviour changes.

## Verification

No local tests, builds or browser screenshots ran, under the 3 Nov Actions-only notice. The deployment workflow runs the existing whole-site checks and rendered-pixel contrast gate, plus `scripts/wave921-ecosystem.py`. The new check visits phone, tablet and desktop widths, asserts all public roles and central placement, measures target sizes and overlaps, opens every role by keyboard, audits each dialog, verifies links and exercises focus return, focus containment and one internal navigation. POST requests are blocked.

Saved screenshots include the whole Partners page, the map and representative dialogs. The actual CI verdict, screenshot inspection and live publication proof are recorded at session close in Context Library `Platform/Live-State.md`, with the durable local evidence in `05-Artifacts/partner-ecosystem-2026-11-03/`.

## Copy and scope

New UI strings are listed in `docs/WAVE921_PLAN.md`; existing role text is referenced there by its authoritative content fields. No user-facing string added or changed beyond those this brief specifies. The map adds no backend integration and submits no enquiries or sign-ups during verification.
