export interface BuddyDestination { id: unknown; kind: "page" | "corner" | "chat" | "inspect"; left: number; top: number; right: number; bottom: number; width: number; height: number; }
export interface BuddyDestinationRect { x: number; y: number; size: number; velocity?: { x: number; y: number; size: number }; }
export declare function findBuddyCorner(preferred: BuddyDestinationRect, viewport: { width: number; height: number; top?: number }, obstacles: { left: number; right: number; top: number; bottom: number }[]): BuddyDestinationRect & { clear: boolean; roomForAmbient: boolean };
export declare function selectBuddyDestination<T extends BuddyDestination>(slots: T[], current: unknown, viewport: { width: number; height: number }): T | null;
export declare function buddyDestinationRect(slot: BuddyDestination, viewportWidth?: number): BuddyDestinationRect;
export declare function followBuddyDestination(current: BuddyDestinationRect | undefined, target: BuddyDestinationRect, seconds: number, reducedMotion?: boolean): BuddyDestinationRect;
