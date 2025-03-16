import { PropertyValues } from 'lit'
import { property, queryAssignedElements } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import type { AccordionItem } from '../accordion-item'
import { BaseElement } from '../core/base-element'
import { findNextFocusable } from '../utils/focus'

/**
 * @element wui-accordion
 */
export class Accordion extends BaseElement {
    namespace = 'accordion'

    /** Allows all items to be collapsible */
    @property({ type: Boolean, reflect: true }) collapsible = false

    /** Allows multiple items to be expanded at the same time */
    @property({ type: Boolean, reflect: true }) multiple = false

    /** Query all assigned accordion items. */
    @queryAssignedElements( { selector: 'wui-accordion-item' })
    private _accordionItems!: AccordionItem[]

    /**
     * Handles property updates.
     * Ensures correct expansion state when `collapsible` or `multiple` change.
     */
    handleUpdated(_changedProperties: PropertyValues) {
        if (_changedProperties.has('collapsible') || _changedProperties.has('multiple')) {
            this.#handleDefaultExpandedItems()
        }
    }

    /** Renders the component.*/
    render() {
        return html`
            <slot
                @slotchange="${this.#handleSlotChange}"
                @keydown="${this.#handleKeyDown}"
                @wui-change="${this.#onChange}"
            ></slot>
        `
    }

    /** Handle slot change, ensuring correct default state. */
    #handleSlotChange() {
        this.#handleDefaultExpandedItems()
    }

    /**
     * Handles keyboard navigation for focus movement.
     * Supports ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, and End.
     */
    #handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement | null
        if (! target) return

        const item = target.closest('wui-accordion-item')
        const accordion = item?.closest('wui-accordion')

        if (accordion !== this) {
            return
        }

        if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            const activeItem = this._accordionItems.find((item) => item.matches(':focus'))

            let nextItem: HTMLElement | null = null
            let trigger: HTMLElement | null = null

            if (activeItem?.tagName.toLowerCase() === 'wui-accordion-item') {
                const currentIndex = this._accordionItems.findIndex((el) => el === activeItem)

                switch (e.key) {
                    case 'Home':
                        nextItem = findNextFocusable(this._accordionItems, currentIndex, 'first')
                        break
                    case 'End':
                        nextItem = findNextFocusable(this._accordionItems, currentIndex, 'last')
                        break
                    case 'ArrowUp':
                        nextItem = findNextFocusable(this._accordionItems, currentIndex, 'previous')
                        break
                    case 'ArrowDown':
                        nextItem = findNextFocusable(this._accordionItems, currentIndex, 'next')
                        break
                }

                if (! nextItem) return

                // Focus the trigger button inside the next item.
                trigger = nextItem.shadowRoot?.querySelector('.trigger') ?? null
                if (! trigger) return

                trigger.focus()

                e.preventDefault()
            }
        }
    }

    /**
     * Handles changes when an item is expanded/collapsed.
     * @param event {Event} Custom event from `wui-accordion-item`.
     */
    #onChange(event: Event) {
        if (event instanceof CustomEvent) {
            const target = event.target as AccordionItem
            const detail = event?.detail

            if (! detail.open) return

            if (this.multiple || event.defaultPrevented) {
                return
            }

            const items = [...this._accordionItems] as AccordionItem[]

            if (items && ! items.length) {
                return
            }

            items.forEach(item => {
                const shouldBeOpen = item === target

                if (item.expanded !== shouldBeOpen) {
                    item.expanded = shouldBeOpen
                }

                if (! this.collapsible) {
                    item._collapsible = ! shouldBeOpen
                }
            })
        }
    }

    /**
     * Ensures correct default expansion behavior:
     * - First item opens by default (if `collapsible` is false).
     * - Only one item stays open unless `multiple` is true.
     */
    #handleDefaultExpandedItems() {
        if (this.multiple) {
            this._accordionItems.forEach(item => item._collapsible = true)
        } else {
            // Ensure `collapsible` is respected.
            if (this.collapsible) {
                this._accordionItems.forEach(item => item._collapsible = true)
            }

            if (this._accordionItems.filter(item => item.hasAttribute('open')).length) {
                // Keep only the first open item (if `collapsible` is false).
                if (! this.collapsible) {
                    this._accordionItems.filter(item => item.hasAttribute('open'))[0]._collapsible = false
                }

                this._accordionItems.filter(item => item.hasAttribute('open')).slice(1).forEach(item => {
                    item.expanded = false
                })
            } else {
                if (! this.collapsible) {
                    // Open the first item by default if none are open.
                    this._accordionItems[0].expanded = true
                    this._accordionItems[0]._collapsible = false
                }
            }
        }
    }
}
