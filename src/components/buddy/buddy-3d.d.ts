export type Form = "property" | "investment" | "support";
export type Inspect = {
  hand: "left" | "right";
  direction: "left" | "right" | "up" | "down";
  radius: number;
};
export interface DrawOptions {
  form?: Form;
  action?: string;
  expression?: string;
  time?: number;
  size?: number;
  x?: number;
  y?: number;
  viewYaw?: number;
  inspect?: Inspect;
  transition?: { from: Form; to: Form; progress: number };
  attention?: { x: number; y: number };
  ambient?: { kind: string; time: number; variant?: number };
}
export interface BuddyRenderer {
  canvas: HTMLCanvasElement;
  resize(width: number, height: number, dpr?: number): void;
  draw(options?: DrawOptions): void;
  metrics(options?: { form?: Form; size?: number; inspect?: Inspect }): {
    body: { width: number; height: number };
    hand: { x: number; y: number };
    lens: { x: number; y: number; radius: number };
  };
  inspectRig(): Array<{
    name: string;
    scale: number[];
    quaternion: number[];
    local: number[];
    world: number[];
    determinant: number;
  }>;
  dispose(options?: { loseContext?: boolean }): void;
}
export const BUDDY_FORM_CHANGE_MS: number;
export const BUDDY_MODEL_URL: string;
export function loadBuddyModel(
  url?: string,
): Promise<{ binary: ArrayBuffer; url: string }>;
export function createBuddyRenderer(
  canvas: HTMLCanvasElement,
  library: { binary: ArrayBuffer; url: string },
): Promise<BuddyRenderer>;
