import { PropertyValues, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { BaseElement } from '../core/base-element'
import { getDefaultIconLibrary, getIconLibrary } from '../utils/icon'
import styles from './icon.css?inline'
import './library.system'

const iconCache = new Map<string, Promise<SVGElement | null>>();

/**
 * @element wui-icon
 */
export class Icon extends BaseElement {
    namespace = 'icon'

    /** Applies component-specific styles. */
    static styles = [unsafeCSS(styles)]

    /** The rendered SVG element, or null if no icon is loaded. */
    @state() private svg: SVGElement | null = null

    /** The default icon library, determined at initialization. */
    @state() private defaultLibrary?: string

    /** The name of the icon to render. */
    @property({ type: String }) name?: string

    /** The name of the icon library to use. Falls back to the default library if not provided. */
    @property({ type: String }) library?: string

    /** The variant of the icon, if applicable. */
    @property({ type: String }) variant?: string

    /** Accessible label for the icon. */
    @property({ type: String }) label?: string

    /** A direct URL source for the icon. Used when no `name` is provided. */
    @property({ type: String }) src?: string

    /** The stroke width of the icon, if applicable. */
    @property({ type: String, attribute: 'stroke-width' }) strokeWidth?: string

    /**
     * Lifecycle method called after the first render.
     * Initializes the default icon library and triggers the initial icon fetch.
     */
    firstUpdated() {
        queueMicrotask(() => {
            this.defaultLibrary = getDefaultIconLibrary()
            this.requestUpdate()
            this.updateComplete.then(() => this.setIcon())
        })
    }

    /** Handles property updates and triggers icon reloading when relevant properties change. */
    handleUpdated(_changedProperties: PropertyValues): void {
        if (['name', 'src', 'library', 'variant'].some(prop => _changedProperties.has(prop))) {
            this.setIcon()
        }

        if (_changedProperties.has('strokeWidth') && this.svg) {
            this.handleStrokeWidth(this.svg)
        }

        if (_changedProperties.has('label') && this.svg) {
            this.handleLabel(this.svg)
        }
    }

    /** Renders the component, returning the resolved SVG element. */
    render() {
        return this.svg
    }

    /** Determines the source URL for the icon, either from a library or a direct `src` reference. */
    getIconSource(): { url?: string; fromLibrary: boolean } {
        const library = getIconLibrary(this.library ?? this.defaultLibrary)

        if (this.name && library) {
            return {
                url: library.resolver(this.name, this.variant),
                fromLibrary: true,
            }
        }

        return {
            url: this.src,
            fromLibrary: false,
        }
    }

    /** Sets accessible labels for the SVG element. */
    handleLabel(svg: SVGElement): void {
        if (this.label) {
            svg.removeAttribute('aria-hidden')
            svg.setAttribute('aria-label', this.label)
        }
    }

    /** Applies stroke width modifications if needed. */
    handleStrokeWidth(svg: SVGElement): void {
        const strokeWidth = svg.getAttribute('stroke-width')
        if ((strokeWidth && this.strokeWidth) && (strokeWidth !== this.strokeWidth)) {
            svg.setAttribute('stroke-width', this.strokeWidth ?? strokeWidth)
        }
    }

    /** Fetches and resolves the SVG icon from the given URL. */
    async resolveIcon(url: string): Promise<SVGElement | null> {
        try {
            const response = await fetch(url, { mode: 'cors' })
            if (! response.ok) return null

            const svgContent = await response.text()
            if (! svgContent) return null

            const parser = new DOMParser()
            const doc = parser.parseFromString(svgContent, 'image/svg+xml')
            const svgElement = doc.querySelector('svg')
            if (! svgElement) return null

            svgElement.part.add('svg')
            svgElement.setAttribute('focusable', 'false')
            svgElement.setAttribute('role', 'img')
            svgElement.setAttribute('aria-hidden', 'true')

            return svgElement
        } catch (error) {
            console.warn(`Failed to resolve icon from ${url}:`, error)
            return null
        }
    }

    /** Loads the icon, either from cache or by fetching it. */
    async setIcon(): Promise<void> {
        if (! this.hasInitialized) return

        try {
            const iconSource = this.getIconSource()
            const { url, fromLibrary } = iconSource
            const library = fromLibrary ? getIconLibrary(this.library ?? this.defaultLibrary) : undefined

            if (! url) return

            let iconResolver = iconCache.get(url)
            if (! iconResolver) {
                iconResolver = this.resolveIcon(url)
                iconCache.set(url, iconResolver)
            }

            const svg = await iconResolver
            if (! svg) {
                iconCache.delete(url)
                return
            }

            if (url !== iconSource.url) return

            this.svg = svg.cloneNode(true) as SVGElement

            if (this.svg) {
                this.handleLabel(this.svg)
                this.handleStrokeWidth(this.svg)

                if (library?.mutator) {
                    library?.mutator(this.svg)
                }
            }
        } catch (_) {
        }
    }
}
