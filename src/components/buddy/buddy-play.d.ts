import type { Character } from "./buddy-engine.js";
export type PlayKind = "ball" | "build" | "home" | "door" | "dance";
export declare const PLAY_DURATIONS: Readonly<Record<PlayKind, number>>;
export declare const PROPS_RECTS: Readonly<Record<"house" | "door" | "hammer" | "brick" | "ball" | "dust", readonly [number, number, number, number]>>;
export declare function drawPlayScene(context: CanvasRenderingContext2D, rig: Character, propsAtlas: HTMLImageElement | undefined | null, form: number, kind: PlayKind, seconds: number, x: number, y: number, scale: number, variant?: number): void;
