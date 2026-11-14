# Wave 1294: Buddy quality and one website actor

Status: implementation in progress. CI, visual review and publication not yet verified.

## Tool decision

Reviewed the official Rive Web runtime documentation (https://rive.app/docs/runtimes/web/web-js), Motion animate documentation (https://motion.dev/docs/animate), and Three.js GLTFLoader documentation (https://threejs.org/docs/pages/GLTFLoader.html) on 14 November 2026.

Rive is a strong dedicated authoring workflow but needs an authored .riv file. No such Buddy project exists in the supplied assets. Motion supplies interpolation and travel, not character artwork. Three.js loads rigged geometry but a runtime installation does not model the character; its additional runtime would also require measured budget work.

Selected a native Canvas2D vector rig and browser animation for page travel. This replaces bitmap body/hand rendering with resolution-independent paths, continuous gloves and a layered extruded shell. The supplied v2-refined key, pound and heart remain the design reference and static failure fallbacks. Front and back are drawn separately with signed projection, so profile views retain depth and the face is absent on the back. It is layered vector depth, not a fully modelled or physically lit 3D asset, and it is not a Rive asset.

## Implementation

The existing interruption-safe animation controller, conversation and topic routing remain. The new body and hand renderer no longer fetches the old bitmap atlas or hand sheet. Pose blending, pointer attention, visibility suspension and reduced-motion still apply. The same artwork module and engine are copied byte-for-byte into both web deployments.

Website illustrations become placements for a persistent actor, with chat taking priority over page placements and corner rest. Nearby multi-card appearances use ordinary service icons so the layout does not contain several empty character holes. Route and scroll movement preserve the active rig rather than remounting it. Existing assistant content, form switching, cancel/retry and focus behavior remain under CI checks.

Authored scene changes, exact route coverage and visual results will be recorded after review. The owner requested no balls or playback controls; these remain absent. Existing Tailwind and bone-white tokens are retained. No backend, model, secrets, infrastructure or native release is included.

## Verification

No local tests, builds, audits or screenshot runner executed under R-OP-1103-22. Focused pure-rig checks, controller tests, single-actor journeys and actual-artwork CI captures are being prepared. No quality, live-state or gate claim before those are read.
