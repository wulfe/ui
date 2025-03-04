import { unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import { getIconLibrary, getDefaultIconLibrary } from '../utilities/icon-library'
import './library.system'
import componentStyles from './icon.css?inline'

const iconCache = new Map()

export class Icon extends BaseElement {
    static styles = [unsafeCSS(componentStyles)]

    static properties = {
        name: { type: String },
        library: { type: String },
        variant: { type: String },
        label: { type: String },
        src: { type: String },
        strokeWidth: { type: String, attribute: 'stroke-width' },
        svg: { state: true },
    }

    constructor() {
        super()
        this.setScope('icon')
        this.name = null
        this.library = null
        this.defaultLibrary = null
        this.variant = null
        this.label = null
        this.src = null
        this.strokeWidth = null
        this.svg = null
    }

    firstUpdated() {
      this.defaultLibrary = getDefaultIconLibrary()
      this.setIcon()
    }

    updated(changedProperties) {
        if (! this.isInitialized) {
            this.isInitialized = true
        }

        if (['name', 'src', 'library', 'variant'].some(prop => changedProperties.has(prop))) {
            this.setIcon()
        }

        if (changedProperties.has('strokeWidth') && this.svg) {
            this.handleStrokeWidth(this.svg)
        }

        if (changedProperties.has('label') && this.svg) {
            this.handleLabel(this.svg)
        }

        if (changedProperties.has('fixedWidth') && this.svg) {
            this.handleLabel(this.svg)
        }
    }

    render() {
        return this.svg
    }

    getIconSource() {
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

    handleLabel(svg) {
        if (! svg) return

        if (this.label) {
            svg.removeAttribute('aria-hidden')
            svg.setAttribute('aria-label', this.label)
        }
    }

    handleStrokeWidth(svg) {
        if (! svg) return
        const strokeWidth = svg.getAttribute('stroke-width')

        if ((strokeWidth && this.strokeWidth) && (strokeWidth !== this.strokeWidth)) {
            svg.setAttribute('stroke-width', this.strokeWidth ?? strokeWidth)
        }
    }

    async resolveIcon(url) {
        try {
            let response = await fetch(url, { mode: 'cors' })

            if (! response.ok) return

            const svgContent = await response.text()

            if (! svgContent) return

            const parser = new DOMParser()
            const document = parser.parseFromString(svgContent, 'image/svg+xml')
            const svgElement = document.querySelector('svg')

            if (! svgElement) return

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

    async setIcon() {
        if (! this.isInitialized) return

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
            if (! svg) iconCache.delete(url)

            if (url !== iconSource.url) return

            this.svg = svg.cloneNode(true)

            this.handleLabel(this.svg)
            this.handleStrokeWidth(this.svg)

            if (library.mutator) {
                library.mutator(this.svg)
            }
        } catch (_) {
        }
    }
}
