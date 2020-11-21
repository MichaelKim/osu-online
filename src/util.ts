export function clamp(val: number, min: number, max: number) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

// Lerp val from [l1, r1] to [l2, r2]
export function lerp(
  val: number,
  l1: number,
  r1: number,
  l2: number,
  r2: number
) {
  return ((val - l1) * (r2 - l2)) / (r1 - l1) + l2;
}
