export type BuddyTopic = "property" | "investment" | "support";

export const buddyLauncherLabel = "Ask Buddy";

export function isBuddyTopic(value: unknown): value is BuddyTopic {
  return value === "property" || value === "investment" || value === "support";
}

export function buddyTopicForPath(pathname: string): BuddyTopic {
  if (/^\/(?:pricing|partner-with-investor|register\/investor)(?:\/|$)/.test(pathname)) return "investment";
  if (/^\/(?:partner-with-|register\/)(?:care-provider|support-provider|social-worker|resident)(?:\/|$)/.test(pathname)) return "support";
  return "property";
}

export function openBuddy(topic: BuddyTopic) {
  window.dispatchEvent(new CustomEvent("iig:open-buddy", { detail: { topic } }));
}
