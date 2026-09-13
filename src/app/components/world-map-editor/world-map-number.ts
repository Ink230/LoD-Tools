/** Precision for authored numbers only; imported document values are left untouched. */
export const authorNumber = (value: number): number => Number(value.toFixed(2));
