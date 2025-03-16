/**
 * Generates a set of modifiers based on a base name and conditional modifiers.
 * Supports booleans (adding/removing modifiers) and string/number values.
 *
 * @param base - The base name (e.g., 'trigger').
 * @param modifiers - An object where keys are modifier names (e.g., 'size') and values can be:
 *   - `true` → Adds the modifier (e.g., 'open').
 *   - `false` → Adds a negated modifier (e.g., 'not-disabled').
 *   - `string` or `number` → Appends the value (e.g., 'size-lg').
 * @returns The generated modifier string (e.g., 'trigger open not-disabled size-lg').
 */
export function generateMods(
    base: string,
    modifiers: Record<string, boolean | string | number> = {}
): string {
    return [
        base,
        ...Object.entries(modifiers).map(([key, value]) => {
            if (value === true) return key
            if (value === false) return `not-${key}`
            return `${key}-${value}` // Handles strings and numbers
        }),
    ].join(' ')
}
