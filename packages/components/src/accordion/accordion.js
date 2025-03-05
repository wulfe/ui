import { html, unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import { findNextFocusable } from '../internal/find-next-focusable'

export class Accordion extends BaseElement {
    static properties = {
        collapsible: { type: Boolean, reflect: true },
        multiple: { type: Boolean, reflect: true },
    }

    constructor() {
        super()
        this.setScope('accordion')
        this.collapsible = false
        this.multiple = false
    }

    connectedCallback() {
        super.connectedCallback()

        this.addEventListener('wui-open', event => {
            if (event.detail.namespace !== 'wui-accordion-item') return

            const accordion = event.target.closest('wui-accordion')
            if (accordion !== this) return

            if (! this.slottedChildren.includes(event.target)) return

            if (! this.multiple) {
                if (! this.collapsible) {
                    this.slottedChildren.map(item => {
                        item.expanded = event.target === item,
                        item.__collapsible = event.target !== item
                    })
                } else {
                    this.slottedChildren.map(item => {
                        item.expanded = event.target === item
                    })
                }
            }
        })
    }

    updated(changedProperties) {
        if (! this.isInitialized) {
            this.isInitialized = true
            return
        }

        if (changedProperties.has('collapsible') || changedProperties.has('multiple')) {
            this.#handleDefaultExpandedItems()
        }
    }

    render() {
        return html`
            <div class="base" part="base" id="${this.scope}">
                <slot @slotchange="${this.#handleSlotChange}" @keydown="${this.#handleKeyDown}"></slot>
            </div>
        `
    }

    get slottedChildren() {
        const slot = this.shadowRoot.querySelector('slot')
        if (! slot) return []

        const assignedNodes = slot.assignedElements({ flatten: true })

        const findAccordionItems = (elements) => {
            return elements.flatMap(el => {
                if (el.tagName.toLowerCase() === 'wui-accordion-item') return el
                if (el.tagName.toLowerCase() === 'wui-accordion') return []
                return findAccordionItems([...el.children])
            })
        }

        return findAccordionItems(assignedNodes)
    }

    get focusableItems() {
        return this.slottedChildren.filter((item) => ! item.disabled)
    }

    #handleSlotChange() {
        this.#handleDefaultExpandedItems()
    }

    #handleDefaultExpandedItems() {
        if (this.multiple) {
            this.slottedChildren.map(item => {
                item.__collapsible = true
            })
        } else {
            if (this.collapsible) {
                this.slottedChildren.map(item => {
                    item.__collapsible = true
                })
            }

            if (this.slottedChildren.filter(item => item.hasAttribute('open')).length) {
                if (! this.collapsible) {
                    this.slottedChildren.filter(item => item.hasAttribute('open'))[0].__collapsible = false
                }

                this.slottedChildren.filter(item => item.hasAttribute('open')).slice(1).forEach(item => {
                    item.expanded = false
                })
            } else {
                if (! this.collapsible) {
                    this.slottedChildren[0].expanded = true
                    this.slottedChildren[0].__collapsible = false
                }
            }
        }
    }

    #handleKeyDown(e) {
        const item = e.target.closest('wui-accordion-item')
        const accordion = item?.closest('wui-accordion')

        if (accordion !== this) {
            return
        }

        if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
            const activeItem = this.slottedChildren.find((item) => item.matches(':focus'))
            let nextItem = null
            let trigger = null

            if (activeItem?.tagName.toLowerCase() === 'wui-accordion-item') {
                if (e.key === 'Home') {
                    nextItem = this.focusableItems[0]
                } else if (e.key === 'End') {
                    nextItem = this.focusableItems[this.focusableItems.length - 1]
                } else if (e.key === 'ArrowUp') {
                    const currentIndex = this.slottedChildren.findIndex((el) => el === activeItem)
                    nextItem = findNextFocusable(this.slottedChildren, this.focusableItems, currentIndex, 'previous')
                } else if (e.key === 'ArrowDown') {
                    const currentIndex = this.slottedChildren.findIndex((el) => el === activeItem)
                    nextItem = findNextFocusable(this.slottedChildren, this.focusableItems, currentIndex, 'next')
                }

                if (! nextItem) {
                    return
                }

                trigger = nextItem.shadowRoot.querySelector('[part=trigger]')

                if (! trigger) {
                    return
                }

                trigger.focus()

                e.preventDefault()
            }
        }
    }
}
