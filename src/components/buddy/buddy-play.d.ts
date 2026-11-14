import type { Character, Pose } from "./buddy-engine.js";
export type AmbientKind = "build" | "dance" | "peek" | "stretch" | "polish";
export type PlayKind = AmbientKind;
export interface AmbientFrame { pose: Pose; x: number; y: number; scale: number; complete: boolean; }
export interface ConstructionFrame { courses: number[]; roof: number; windows: number[]; door: number; doorOpen: number; assembled: boolean; }
export declare const AMBIENT_BOUNDS: Readonly<{ width: 640; height: 440; anchorX: 440; anchorY: 220 }>;
export declare const AMBIENT_DURATIONS: Readonly<Record<AmbientKind, number>>;
export declare const PLAY_DURATIONS: typeof AMBIENT_DURATIONS;
export declare const PROPS_RECTS: Readonly<Record<"house" | "door" | "hammer" | "dust", readonly [number, number, number, number]>>;
export declare function sampleAmbientScene(form: number, kind: AmbientKind, seconds: number, variant?: number, sourcePose?: Pose, targetPose?: Pose): AmbientFrame;
export declare function sampleConstruction(seconds: number): ConstructionFrame;
export declare function drawAmbientScene(context: CanvasRenderingContext2D, rig: Character, propsAtlas: HTMLImageElement | undefined | null, form: number, kind: AmbientKind, seconds: number, originX?: number, originY?: number, scale?: number, variant?: number, sourcePose?: Pose, targetPose?: Pose): void;
export declare function drawPlayScene(context: CanvasRenderingContext2D, rig: Character, propsAtlas: HTMLImageElement | undefined | null, form: number, kind: PlayKind, seconds: number, x: number, y: number, scale: number, variant?: number): void;
