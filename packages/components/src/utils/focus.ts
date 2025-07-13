/**
 * Finds the next focusable element in a given direction within a list of elements.
 *
 * @param elements - The complete list of elements.
 * @param currentIndex - The index of the currently focused element.
 * @param direction - The direction to search ('next' or 'previous').
 * @param wrap - Whether to wrap around at the ends (default: true).
 * @returns The next focusable element, or loops to the start/end if none is found.
 */
export function findNextFocusable(
    elements: HTMLElement[],
    currentIndex: number,
    direction: 'next' | 'previous' | 'first' | 'last',
    wrap: boolean = true,
): HTMLElement | null {
    if (! elements.length) return null

    if (direction === 'first') return elements.find((el) => ! el.hasAttribute('disabled')) ?? null
    if (direction === 'last') return [...elements].reverse().find((el) => ! el.hasAttribute('disabled')) ?? null

    // Determine step based on direction
    const iterator = direction === 'next' ? 1 : -1
    let nextIndex = currentIndex + iterator

    // Traverse the list in the given direction
    while (nextIndex >= 0 && nextIndex < elements.length) {
        const nextItem = elements[nextIndex] || null

        // Return the next item if it exists and is not disabled
        if (nextItem && ! nextItem.hasAttribute('disabled')) {
            return nextItem
        }

        // Move to the next element in the given direction
        nextIndex += iterator
    }

    // If no valid element is found and wrap is disabled, return null
    if (!wrap) {
        return null
    }

    // If no valid element is found, loop to the first or last focusable element
    return direction === 'next'
        ? elements.find((el) => ! el.hasAttribute('disabled')) ?? null // First valid element
        : [...elements].reverse().find((el) => ! el.hasAttribute('disabled')) ?? null // Last valid element
}
