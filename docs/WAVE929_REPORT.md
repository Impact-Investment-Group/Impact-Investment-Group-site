# Wave 929: candid public website photographs

The user asked for less polished, more candid and realistic imagery, and confirmed public website only. Every active photographic scene now uses a new built-in imagegen edit of the previous daylight image. People have more relaxed, asymmetric expressions and posture, natural skin, flyaway hair and softly creased clothing. Domestic and property scenes retain ordinary lived-in details and neutral daylight. The aerial view receives a restrained photographic refinement.

Eight scenes supply nine source assets because the street scene is shared by two differently sized images. All thirty-two existing responsive derivatives are replaced with the same filenames and dimensions. Existing crops and responsive loading remain in place. The blueprint parts of composite property images remain intentional diagrams; other diagrams, logos, real team portraits, AI characters and product screenshots are untouched. Retired, unreferenced photos are not shipped as new content. Nothing changes in the signed-in platform.

The prior release's rendered-colour check found the small Partners eyebrow just below the normal-text contrast threshold. Its colour now uses the existing ink token. The requested Transforming Lives teal remains exactly #267977. Inspection of the existing CI screenshots also found the longest ecosystem dialog heading too close to its close button at 360px; additional right padding and a shrinkable title correct that spacing.

## Assets and evidence

`docs/wave929/prompts.json` contains the exact prompt set and built-in mode. `docs/wave929/installed-manifest.json` records installed file hashes, byte sizes and source dimensions. Generated masters and non-destructive backups live in `05-Artifacts/website-candid-2026-11-03/`. These are illustrative generated marketing images, not evidence of actual customers or properties.

All eight generated masters were visually inspected before installation. A separate read-only source inventory confirmed that the nine source assets cover every active photographic scene. The asset diff contains only those sources and their responsive derivatives; protected image families have no changes.

No local tests, site builds or browser screenshots ran under the Actions-only notice. The existing GitHub Actions workflow checks every public page, interactive journeys, all eleven ecosystem roles at four widths, accessibility, rendered colour contrast and light page surfaces before deployment. The final CI verdict and public deployment proof are recorded in Context Library Platform/Live-State.md and the local artifact folder after the run, rather than inferred from this source commit.

The initial release spent over fifteen minutes in the full-history checkout before any build or test. Ordinary release checkout now fetches one commit and materialises the root configuration, workflow, source, public assets and scripts. Historical documentation and screenshots are not inputs to these checks; their output directories are recreated by the scripts. The explicit older-source escape hatch retains full commit history. All check commands, assertions and deployment requirements remain unchanged.

No user-facing string added or changed beyond those this brief specifies.
