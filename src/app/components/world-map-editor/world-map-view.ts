/** Presentation only: SC's negative-Y-up camera sees positive Z toward screen top. */
export function orientPoint(x: number, z: number, turns: number) {
  const quarter = ((turns % 4) + 4) % 4;
  const cosine = Number.isInteger(quarter) ? [1, 0, -1, 0][quarter] : Math.cos(quarter * Math.PI / 2);
  const sine = Number.isInteger(quarter) ? [0, -1, 0, 1][quarter] : -Math.sin(quarter * Math.PI / 2);
  // A rotation followed by this reflection is self-inverse.
  return { x: cosine * x + sine * z, z: sine * x - cosine * z };
}
