/** Presentation only: SC's negative-Y-up camera sees positive Z toward screen top. */
export function orientPoint(x: number, z: number, turns: number) {
  const quarter = ((turns % 4) + 4) % 4;
  const cosine = [1, 0, -1, 0][quarter];
  const sine = [0, -1, 0, 1][quarter];
  // A rotation followed by this reflection is self-inverse.
  return { x: cosine * x + sine * z, z: sine * x - cosine * z };
}
