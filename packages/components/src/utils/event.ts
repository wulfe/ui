import { WUI } from "../core/consts"
import { WuiEvent } from "../core/types"

/**
 * Emits a custom event from a DOM element with standardized naming and options.
 *
 * This utility function creates and dispatches a CustomEvent with the provided details.
 * All events are automatically prefixed with the UI library namespace (WUI) for consistent
 * event naming across the component library.
 *
 * @param element - The DOM element that will dispatch the event.
 * @param eventConfig - Event configuration object containing:
 * @param eventConfig.name - The base name of the event (without the WUI prefix).
 * This name will be prefixed with WUI when the event is dispatched.
 * @param eventConfig.detail - Optional data payload associated with the event.
 * Use this to pass relevant information to event listeners.
 * @param eventConfig.options - Optional `CustomEvent` options (e.g., `bubbles`, `cancelable`).
 * These options control the behavior of the dispatched event.
 *
 * @returns boolean - Returns `false` if the event was prevented using `preventDefault()`,
 * otherwise returns `true`.
 *
 * @example
 * // Basic usage
 * emitEvent(this, { name: 'change' })
 *
 * // With data
 * emitEvent(this, { name: 'change', detail: { value: 'new-value' } })
 *
 * // With custom options
 * emitEvent(this, {
 *     name: 'select',
 *     detail: { selectedItem: item },
 *     options: { cancelable: true }
 * })
 */
export function emitEvent<T extends Record<string, any>>(
    element: Element,
    { name, detail = {} as T, options = {} }: WuiEvent<T>
): boolean {
    // Merge default event options with any provided options.
    const eventOptions: EventInit = {
        bubbles: true,     // Event bubbles up through the DOM tree.
        composed: true,    // Event can cross shadow DOM boundaries.
        cancelable: false, // By default, events cannot be cancelled.
        ...options
    }

    // Create the custom event with namespaced event name.
    const event = new CustomEvent(`${WUI}-${name}`, {
        detail,
        ...eventOptions,
    })

    // Dispatch the event from the provided element.
    element.dispatchEvent(event)

    // Return whether the event was NOT prevented.
    // (false if preventDefault() was called, true otherwise).
    return ! event.defaultPrevented
}
