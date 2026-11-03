# Wave 928: Transforming Lives in the supplied teal

The homepage's Transforming Lives caption now uses `text-teal-600`. The attachment is a uniform RGB 38, 121, 119 swatch, exactly matching the site's existing `--brand-teal-ink` token in `src/styles.css`. No new colour or global token was introduced.

Only that caption's colour selection and its explanatory code comment changed. The other two captions, text, type sizing, photos and controls retain their existing values. No image was edited. No local tests or builds ran under the Actions-only notice; the existing production build, browser and rendered-colour checks provide the release gate.

The change builds on the pending wave 921 ecosystem. Publication status and the actual CI result are recorded in Context Library `Platform/Live-State.md`, not assumed from a successful push.
