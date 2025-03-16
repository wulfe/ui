import { LitElement, PropertyValues, unsafeCSS } from 'lit'
import { elUniqId } from '../utils/dom'
import { emitEvent } from '../utils/event'
import { WuiEvent } from './types'
import preflight from '@wulfe/ui-css/preflight.css?inline'

/**
 * BaseElement - Foundation class for all WUI web components.
 *
 * Extends LitElement to provide additional functionality:
 * - Automatic unique ID generation for each component instance.
 * - Event management system with queueing capabilities.
 * - Standard event enrichment with metadata.
 * - Global CSS reset via preflight CSS.
 */
export class BaseElement extends LitElement {
    /**
     * Unique identifier for this component instance.
     * Generated automatically during instantiation.
     */
    uid = elUniqId(this)

    /**
     * Optional namespace for the component.
     * Can be used for event categorization and filtering.
     */
    namespace?: string

    /**
     * Include the preflight CSS in all components.
     * This ensures consistent styling baseline across all components.
     */
    static styles = [unsafeCSS(preflight)]

    /**
     * Private queue for storing events to be emitted later.
     * Useful for events that need to be sent during initialization.
     */
    #events: WuiEvent<Record<string, any>>[] = []

    /** Flag to prevent multiple concurrent queue processing operations. */
    #eventScheduled = false

    /** Tracks whether the component has finished its first update cycle. */
    #isInitialized = false

    /**
     * Queue an event for later emission.
     * Events will be processed during the next microtask.
     *
     * @param eventConfig - Event configuration object containing:
     * @param eventConfig.name - The base name of the event (without the WUI prefix).
     * This name will be prefixed with WUI when the event is dispatched.
     * @param eventConfig.detail - Optional data payload associated with the event.
     * Use this to pass relevant information to event listeners.
     * @param eventConfig.options - Optional `CustomEvent` options (e.g., `bubbles`, `cancelable`).
     * These options control the behavior of the dispatched event.
     */
    addEvent<T extends Record<string, any>>({ name, detail, options }: WuiEvent<T>) {
        this.#events.push({ name, detail, options })
    }

    /**
     * Emit an event immediately with enhanced metadata.
     * Automatically adds component ID, namespace, and timestamp.
     *
     * @param eventConfig - Event configuration object containing:
     * @param eventConfig.name - The base name of the event (without the WUI prefix).
     * This name will be prefixed with WUI when the event is dispatched.
     * @param eventConfig.detail - Optional data payload associated with the event.
     * Use this to pass relevant information to event listeners.
     * @param eventConfig.options - Optional `CustomEvent` options (e.g., `bubbles`, `cancelable`).
     * These options control the behavior of the dispatched event.
     *
     * @returns boolean - Whether the event was successfully dispatched and not prevented.
     */
    emitEvent<T extends Record<string, any>>({ name, detail, options }: WuiEvent<T>): boolean {
        try {
            return emitEvent(this, {
                name,
                detail: {
                    // Spread the original detail object, excluding reserved fields.
                    ...(detail as Omit<T, 'uid' | 'namespace' | 'timeStamp'>),
                    // Add standard metadata to all events.
                    uid: this.uid,                       // Component ID
                    namespace: this.namespace,           // Component namespace
                    timeStamp: new Date().toISOString(), // ISO timestamp
                },
                options,
            })
        } catch (error) {
            console.error(`Failed to emit event: ${name}`, error)
            return false
        }
    }

    /**
     * Process all queued events in the next microtask.
     *
     * This method schedules the processing of all queued events using `queueMicrotask()`
     * to ensure they're dispatched after the component has finished updating.
     * It also includes safeguards to prevent concurrent queue processing.
     */
    queueEvents() {
        // Skip if no events or already scheduled.
        if (! this.#events.length || this.#eventScheduled) return

        // Mark as scheduled to prevent multiple calls.
        this.#eventScheduled = true

        // Use microtask timing to ensure DOM is ready.
        queueMicrotask(() => {
            // Emit each queued event.
            this.#events.forEach(event => this.emitEvent(event))

            // Clear the queue and reset scheduled flag.
            this.#events = []
            this.#eventScheduled = false
        })
    }

    /**
     * Clear all queued events without processing them.
     * Useful when the component is being destroyed or reset.
     */
    clearEventQueue() {
        this.#events = []
        this.#eventScheduled = false
    }

    /**
     * Checks whether the component has completed its first update cycle.
     *
     * @returns boolean - `true` if the component has been initialized, otherwise `false`.
     */
    hasInitialized(): boolean {
        return this.#isInitialized
    }

    /**
     * Lifecycle method triggered whenever observed properties change.
     * Ensures `handleUpdated()` only runs after the first update cycle.
     */
    updated(_changedProperties: PropertyValues): void {
        super.updated(_changedProperties)

        if (! this.#isInitialized) {
            this.#isInitialized = true
            return
        }

        this.handleUpdated(_changedProperties)
    }

    /**
     * Hook for handling property updates after the first render.
     * Can be overridden in subclasses to respond to property changes.
     */
    handleUpdated(_changedProperties: PropertyValues): void {}

    /**
     * Lifecycle callback when the element is removed from the DOM.
     * Clear any pending events to prevent memory leaks.
     */
    disconnectedCallback() {
        super.disconnectedCallback()
        this.clearEventQueue()
    }
}
