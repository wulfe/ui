import { PropertyValues, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import type { TreeItem } from '../tree-item'
import { BaseElement } from '../core/base-element'
import { generateMods } from '../utils/mods'
import { findNextFocusable } from '../utils/focus'
import styles from './tree.css?inline'

/**
 * @element wui-tree
 */
export class Tree extends BaseElement {
    namespace = 'tree'

    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    private lastFocusedItem: TreeItem | null = null

    @property({ type: String, reflect: true }) selection: 'none' | 'single' | 'multiple' = 'single'
    @property({ type: String, reflect: true }) strategy: 'strict' | 'leaf' = 'strict'

    constructor() {
        super()

        this.addEventListener('focusin', this.#handleFocusIn)
        this.addEventListener('focusout', this.#handleFocusOut)
    }

    connectedCallback(): void {
        super.connectedCallback()

        this.setAttribute('role', 'tree')
        this.setAttribute('tabindex', '0')

        if (this.selection !== 'none') {
            this.setAttribute('aria-multiselectable', `${this.selection === 'multiple'}`)
        }
    }

    render() {
        return html`
            <div
                class="base"
                @click="${this.#handleClick}"
                @keydown="${this.#handleKeyDown}"
            >
                <slot @slotchange="${this.#handleSlotChange}"></slot>
            </div>
        `
    }

    #handleClick(event: Event) {
        const target = event.target as TreeItem
        const treeItem = target.closest('wui-tree-item')

        if (! treeItem || treeItem.disabled) return

        if (treeItem.hasChildren) {
            treeItem.expanded = !treeItem.expanded
        }
    }

    #handleKeyDown(event: KeyboardEvent) {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
            return
        }

        if (event.composedPath().some(target =>
            target instanceof HTMLElement &&
            ['input', 'textarea'].includes(target.tagName.toLowerCase())
        )) {
            return
        }

        const target = event.target as HTMLElement | null
        if (! target) return

        const item = target.closest('wui-tree-item') as TreeItem | null
        const tree = item?.closest('wui-tree') as Tree | null

        if (tree !== this) return

        const items = this.#getFocusableItems()

        if (items.length > 0) {
            event.preventDefault()

            const activeItem = items.find((item) => item.matches(':focus'))
            const currentIndex = items.findIndex((el) => el === activeItem)

            let nextItem: TreeItem | null = null

            if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                switch (event.key) {
                    case 'Home':
                        nextItem = findNextFocusable(items, currentIndex, 'first') as TreeItem
                        break
                    case 'End':
                        nextItem = findNextFocusable(items, currentIndex, 'last') as TreeItem
                        break
                    case 'ArrowUp':
                        nextItem = findNextFocusable(items, currentIndex, 'previous', false) as TreeItem
                        break
                    case 'ArrowDown':
                        nextItem = findNextFocusable(items, currentIndex, 'next', false) as TreeItem
                        break
                }
            }

            if (['ArrowLeft'].includes(event.key)) {
                const parentItem = activeItem?.parentElement?.closest('wui-tree-item') as TreeItem | null

                if (!activeItem) return

                if (activeItem.hasChildren && activeItem.expanded) {
                    activeItem.expanded = false
                } else if (parentItem) {
                    nextItem = parentItem
                }
            }

            if (['ArrowRight'].includes(event.key)) {
                if (activeItem && activeItem.hasChildren) {
                    if (!activeItem.expanded) {
                        activeItem.expanded = true
                    } else {
                        nextItem = findNextFocusable(items, currentIndex, 'next', false) as TreeItem
                    }
                }
            }

            if (!nextItem) return
            this.#focusItem(nextItem)
        }
    }

    #handleFocusIn(event: FocusEvent) {
        const target = event.target as TreeItem

        if (event.target === this) {
            this.#focusItem(this.lastFocusedItem || this.#getAllTreeItems()[0])
            return
        }

        if (target.tagName.toLowerCase() === 'wui-tree-item') {
            if (target.disabled) {
                this.focus()
            } else {
                if (this.lastFocusedItem) {
                    this.lastFocusedItem.setAttribute('tabindex', '-1')
                }

                this.lastFocusedItem = target
                this.setAttribute('tabindex', '-1')

                target.setAttribute('tabindex', '0')
            }
        }
    }

    #handleFocusOut(event: FocusEvent) {
        const relatedTarget = event.relatedTarget as HTMLElement
        if (!relatedTarget || !this.contains(relatedTarget)) {
            this.setAttribute('tabindex', '0')
        }
    }

    #handleSlotChange() {
        this.#getAllTreeItems().forEach(item => {
            item.selectable = this.selection !==  'none'
        })
    }

    #getAllTreeItems(): TreeItem[] {
        return [...this.querySelectorAll('wui-tree-item')]
    }

    #focusItem(item?: TreeItem | null) {
        item?.focus()
    }

    #getFocusableItems() {
        const items = this.#getAllTreeItems()

        return items.filter(item => {
            if (item.offsetParent === null) return false
            if (item.disabled) return false
            return item
        })
    }
}
