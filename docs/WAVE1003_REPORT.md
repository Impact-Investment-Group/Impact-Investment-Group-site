# Wave 1003: smoother scrolling

Israel reported lag when scrolling through the public website on 5 November 2026. This wave preserves the existing public copy, assets and interactions.

## Findings and changes

- Same-runner CI profiling reproduced a continuous desktop frame loop and delayed wheel travel caused by the added momentum library. Wheel and touch input now use native browser scrolling; explicit anchor and back-to-top actions retain their existing smooth/reduced-motion behaviour.
- The section rail was reading each heading's geometry every scrolling frame. It now refreshes cached positions when layout changes, including image/font resizing and the end of route/reveal animations. Reading-progress height and hero-carousel panel offsets are also measured on resize rather than on every scroll.
- Map pulses and the council logo lane pause outside the viewport, in hidden tabs and under reduced motion. They resume when visible. Phone and tablet headers retain the light design without repeatedly blurring the moving page beneath them.
- The regional map still imported and processed historic district polygons to compute a field it no longer displayed. That unused membership calculation, geometry import and obsolete hub builder were removed. The existing country outline, regional counts, dot density and drawing remain, with before/after canvas hashes checked in CI.
- Image-fade handlers no longer retain completed or removed images for the lifetime of the application. Hero photographs decode asynchronously. No photograph or team headshot was changed.

## Verification

The dedicated GitHub Actions comparison builds baseline `6f69711` and the candidate on the same runner, using desktop and touch-sized Chromium with fourfold CPU slowdown. It records idle callbacks, loaded JavaScript bytes, scroll work, wheel travel and offscreen loops on Home, Our Services and the investor partner page. The initial control run built identical source twice to show timing noise. Candidate assertions cover native input, offscreen/reduced-motion pause and resume, light mobile header, removed-image cleanup and identical map pixels. Timings are lab measurements, not physical-device certification or a universal speed percentage.

The normal deployment workflow retains all public page, interaction, FAQ publisher, ecosystem, accessibility and screenshot checks. No local tests, build or browser capture ran. Final measurements, screenshots, exact-commit deployment and public verification are recorded in Context Library `Platform/Live-State.md` and local `05-Artifacts/website-performance-2026-11-05/`.

References: [browser rendering work](https://web.dev/articles/rendering-performance), [animation performance](https://web.dev/articles/animations-guide), [Lenis implementation](https://github.com/darkroomengineering/lenis). The installed library source and actual site measurements, rather than library size alone, informed the scrolling change.

No user-facing string added or changed beyond those this brief specifies. Signed-in application, business data, email delivery, infrastructure and team imagery are unchanged.
