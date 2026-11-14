export type Pose = Record<string, number>;
export interface Arm { s: number[]; e: number[]; c: number[]; w: number[]; angle: number; }
export interface DrawLayers { beforeHands?: (context: CanvasRenderingContext2D, parts: { left: Arm; right: Arm; pose: Pose }) => void; }
export declare function limb(shoulder: number[], wrist: number[], lengths: number[], side: number, preferred?: number[]): Arm;
export declare const anatomy: { w: number; h: number; face: number[]; eyes: number; shoulders: number[][]; limbs: number[] }[];
export { TORNADO_DURATION_SECONDS, TORNADO_REVEAL_START, TORNADO_RETARGET_UNTIL, TORNADO_TIMING } from "./buddy-motion.js";

export declare function pose(form: number, action: number, seconds: number, style?: number, expression?: number): Pose;
export declare function blend(from: Pose, to: Pose, progress: number): Pose;
export declare function ease(progress: number): number;
export declare function clamp(value: number, minimum?: number, maximum?: number): number;
export declare const names: string[];
export declare const expressions: string[];
export declare const styles: string[];
export declare const forms: string[];

export declare class Character {
  constructor(atlas?: HTMLImageElement, hands?: HTMLImageElement);
  body(context: CanvasRenderingContext2D, form: number, yaw: number): void;
  draw(context: CanvasRenderingContext2D, form: number, pose: Pose, x: number, y: number, scale?: number, alpha?: number, layers?: DrawLayers): void;
  transition(
    context: CanvasRenderingContext2D,
    from: number,
    to: number,
    transition: "Tornado" | "Spin" | "Bounce",
    progress: number,
    action: number,
    style: number,
    x: number,
    y: number,
    scale: number,
    sourcePose?: Pose,
    targetPose?: Pose,
  ): void;
}
