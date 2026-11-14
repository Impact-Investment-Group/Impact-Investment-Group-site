export interface BuddyDestination { id: unknown; kind: "page" | "corner" | "chat"; left: number; top: number; right: number; bottom: number; width: number; height: number; }
export interface BuddyDestinationRect { x: number; y: number; size: number; }
export declare function selectBuddyDestination<T extends BuddyDestination>(slots: T[], current: unknown, viewport: { width: number; height: number }): T | null;
export declare function buddyDestinationRect(slot: BuddyDestination): BuddyDestinationRect;
export declare function followBuddyDestination(current: BuddyDestinationRect | undefined, target: BuddyDestinationRect, seconds: number, reducedMotion?: boolean): BuddyDestinationRect;
