/**
 * Represents the allowed heading levels in HTML (h1 to h6).
 *
 * This type is used to ensure that heading-related components and utilities
 * consistently handle valid heading levels.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Defines the structure of an event used in the WUI component library.
 *
 * This type provides a standardized way to define and dispatch custom events,
 * ensuring consistency across components.
 *
 * @template T - The type of the event detail data. Defaults to an empty object (`{}`).
 * Use this to specify the structure of the data passed with the event.
 * @property name - The base name of the event (without the WUI prefix).
 * This name will be prefixed with WUI when the event is dispatched.
 * @property detail - Optional data payload associated with the event.
 * Use this to pass relevant information to event listeners.
 * @property options - Optional `CustomEvent` options (e.g., `bubbles`, `cancelable`).
 * These options control the behavior of the dispatched event.
 */
export type WuiEvent<T extends Record<string, any> = {}> = {
    readonly name: string
    readonly detail?: T
    readonly options?: EventInit
}

/**
 * Defines the configuration for an icon library.
 *
 * An icon library consists of a resolver function that generates the
 * icon URL, an optional mutator function to modify the SVG before
 * rendering, and a flag to indicate whether it's the default library.
 */
export interface IconLibraryConfig {
    /**
     * A function that resolves an icon name to a URL or data URI.
     * @param name - The name of the icon.
     * @param variant - (Optional) The style variant of the icon (e.g., "outline", "filled").
     * @returns The URL or data URI of the icon.
     */
    resolver: (name: string, variant?: string) => string

    /**
     * An optional function that allows modification of the SVG element
     * before it is rendered.
     * @param svg - The SVG element to be modified.
     */
    mutator?: (svg: SVGElement) => void

    /**
     * Indicates whether this library should be used as the default.
     * Defaults to `false` if not provided.
     */
    default?: boolean
}
