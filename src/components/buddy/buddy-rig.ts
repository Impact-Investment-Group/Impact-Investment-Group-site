// Runtime-only surface. Keep editor label exports out of the lazy browser rig
// without changing the complete engine API used by artwork tooling and tests.
export { Character, pose, blend, ease, TORNADO_DURATION_SECONDS, TORNADO_RETARGET_UNTIL } from "./buddy-engine.js";
