// A fixed arm envelope preserves Buddy's body scale through every gesture.
// The pixels outside the layout slot never take pointer input.
export const BUDDY_SIDE_PADDING = 1 / 8;

export function buddyCanvasFrame({ size, width, height, ambient = false }) {
  return { size, x: ambient ? width - size * (0.5 + BUDDY_SIDE_PADDING) : width / 2, y: height / 2 };
}

export function buddyCanvasLayout({ size, ambient = false, inspect = false }) {
  const width = size * (inspect ? 1 : ambient ? 7 / 4 : 5 / 4);
  const height = size * (ambient ? 9 / 8 : 1);
  return { width, height, ...buddyCanvasFrame({ size, width, height, ambient }) };
}
