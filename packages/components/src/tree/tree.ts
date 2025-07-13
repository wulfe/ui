import { unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import { TreeItem } from '../tree-item'
import { BaseElement } from '../core/base-element'
import { findNextFocusable } from '../utils/focus'
import styles from './tree.css?inline'

const MutationObserverConfig = {
    observerOptions: {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      attributeFilter: ['selected']
    }
}

/**
 * @element wui-tree
 */
export class Tree extends BaseElement {
    namespace = 'tree'

    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /** MutationObserver instance to track selected attribute changes. */
    private observer?: MutationObserver

    /** Handler function for the MutationObserver. */
    private handleMutation: MutationCallback

    private lastFocusedItem: TreeItem | null = null
    private lastSelection: TreeItem[] = []

    @property({ type: String, reflect: true }) selection: 'none' | 'single' | 'multiple' = 'single'
    @property({ type: String, reflect: true }) strategy: 'strict' | 'leaf' = 'strict'

    constructor() {
        super()

        this.handleMutation = (mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'selected') {
                    const target = mutation.target as TreeItem
                    this.observer?.disconnect()

                    if (this.selection === 'none') {
                        const items = this.#getAllTreeItems()
                        for (const item of items) {
                            item.selected = false
                        }
                    } else {
                        if (this.selection === 'single' && this.selectedItems.length > 1) {
                            this.#enforceSingleSelection(target)
                        }

                        const newSelection = this.selectedItems
                        if (this.#selectionChanged(this.lastSelection, newSelection)) {
                            this.addEvent({ name: 'selection-change' })
                            this.queueEvents()

                            this.lastSelection = newSelection
                        }
                    }

                    this.observer?.observe(this, MutationObserverConfig.observerOptions)
                    break
                }
            }
        }

        this.addEventListener('focusin', this.#handleFocusIn)
        this.addEventListener('focusout', this.#handleFocusOut)
    }

    connectedCallback() {
        super.connectedCallback()

        this.setAttribute('role', 'tree')
        this.setAttribute('tabindex', '0')

        if (this.selection !== 'none') {
            this.setAttribute('aria-multiselectable', `${this.selection === 'multiple'}`)
        }
    }

    firstUpdated() {
        this.observer = new MutationObserver(this.handleMutation)
        this.observer?.observe(this, MutationObserverConfig.observerOptions)
    }

    render() {
        return html`
            <div
                class="base"
                part="base"
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

        this.#selectItem(treeItem)

        if (this.selection === 'none') {
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

            if (['Enter', ' '].includes(event.key)) {
                if (activeItem) {
                    this.#selectItem(activeItem)

                    if (this.selection === 'none') {
                        activeItem.expanded = !activeItem.expanded
                    }
                }
            }

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

                if (activeItem.collapsible && activeItem.expanded) {
                    activeItem.expanded = false
                } else if (parentItem) {
                    nextItem = parentItem
                }
            }

            if (['ArrowRight'].includes(event.key)) {
                if (activeItem && activeItem.collapsible) {
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

        this.#updateHierarchy()
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

    #selectItem(selectedItem: TreeItem) {
        if (this.selection === 'none') return

        if (this.selection === 'multiple') {
            selectedItem.selected = !selectedItem.selected
        } else if (this.selection === 'single') {
            this.#enforceSingleSelection(selectedItem)
        }
    }

    #enforceSingleSelection(keep: TreeItem) {
        const items = this.#getAllTreeItems()
        for (const item of items) {
            item.selected = item === keep
        }
    }

    get selectedItems(): TreeItem[] {
        const items = this.#getAllTreeItems()
        return items.filter((item: TreeItem) => item.selected)
    }

    #selectionChanged(oldSelection: TreeItem[], newSelection: TreeItem[]) {
        if (oldSelection.length !== newSelection.length) return true
        return newSelection.some(item => !oldSelection.includes(item))
    }

    #updateHierarchy() {
        const rootItems = [...this.querySelectorAll(':scope > wui-tree-item')] as TreeItem[]
        this.#processTreeItems(rootItems, 1)
    }

    #processTreeItems(items: TreeItem[], currentLevel: number) {
        const setsize = items.length

        items.forEach((item, index) => {
            const posinset = index + 1

            item.level = currentLevel
            item.posinset = posinset
            item.setsize = setsize

            const nestedChildrenSlot = item.shadowRoot?.querySelector('slot[name=children]') as HTMLSlotElement | null
            const nestedItems = nestedChildrenSlot ?
                nestedChildrenSlot.assignedElements().filter(el => el.tagName.toLowerCase() === 'wui-tree-item') as TreeItem[] :
                []

            if (nestedItems.length > 0) {
                this.#processTreeItems(nestedItems, currentLevel + 1)
            }
        })
    }
}
