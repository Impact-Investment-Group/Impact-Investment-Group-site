export interface IdleStep { action: number; expression: number; seconds: number; style: number; }
export declare function createIdleDirector(random?: () => number): { next(form?: number): IdleStep };
export declare const TORNADO_DURATION_SECONDS: number;
export declare const TORNADO_REVEAL_START: number;
export declare const TORNADO_RETARGET_UNTIL: number;
export declare const TORNADO_TIMING: Readonly<{ seconds: number; concealStart: number; concealEnd: number; retargetUntil: number; revealStart: number; revealEnd: number }>;
