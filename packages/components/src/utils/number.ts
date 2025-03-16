/**
 * Checks if a number is within a specified range (inclusive).
 *
 * @param x - The number to check.
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @returns Returns `true` if `x` is within the range [min, max], otherwise `false`.
 */
export function inRange(x: number, min: number, max: number): boolean {
    return x >= min && x <= max
}
