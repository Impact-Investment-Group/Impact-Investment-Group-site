export type Pose = Record<string, number>;

export function pose(form: number, action: number, seconds: number, style?: number, expression?: number): Pose;
export function blend(from: Pose, to: Pose, progress: number): Pose;
export function ease(progress: number): number;
export function clamp(value: number, minimum?: number, maximum?: number): number;
export const names: string[];
export const expressions: string[];
export const styles: string[];
export const forms: string[];

export class Character {
  constructor(atlas: HTMLImageElement);
  draw(context: CanvasRenderingContext2D, form: number, pose: Pose, x: number, y: number, scale?: number, alpha?: number): void;
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
  ): void;
}
