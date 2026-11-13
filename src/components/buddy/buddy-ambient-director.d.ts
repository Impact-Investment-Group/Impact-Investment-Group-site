export type AmbientKind = "build" | "dance" | "peek" | "stretch" | "polish";
export interface AmbientStep { kind: AmbientKind; variant: number; seconds: number; restSeconds: number }
export declare function createAmbientDirector(random?: () => number): { next(): AmbientStep };
