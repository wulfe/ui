import { nothing, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import { findNextFocusable } from '../utils/focus'
import styles from './tab-group.css?inline'

/**
 * Configuration options for the MutationObserver used to track tab selection changes.
 */
const MutationObserverConfig = {
    observerOptions: {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      attributeFilter: ['selected']
    }
}

/**
 * @element wui-tab-group
 *
 * @slot - Default slot for tab panels.
 * @slot tab - Slot for tab elements.
 *
 * @part list - The tablist container element
 */
export class TabGroup extends BaseElement {
    namespace = 'tab-group'

    /** Inherits styles from `BaseElement` and applies additional component-specific styles. */
    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /** MutationObserver instance to track selected attribute changes. */
    private observer?: MutationObserver

    /** Handler function for the MutationObserver. */
    private handleMutation: MutationCallback

    /** Reference to the currently selected tab element. */
    private selectedTab: Element | null = null

    /**
     * Accessible label for the tab group.
     * @attr label - Reflects to the `label` attribute in HTML.
     */
    @property({ type: String, reflect: true }) label?: string

    /**
     * Controls how tabs are activated.
     * - 'auto': Tabs are activated automatically when they receive focus.
     * - 'manual': Tabs must be explicitly selected by clicking or pressing Enter/Space.
     *
     * @attr activation - Reflects to the `activation` attribute in HTML.
     */
    @property({ type: String, reflect: true }) activation: 'auto' | 'manual' = 'auto'

    /**
     * Initializes the TabGroup component.
     * Sets up the selected tab and configures the mutation observer handler.
     */
    constructor() {
        super()

        // Initialize selected tab to the default (first available or explicitly marked).
        this.selectedTab = this.defaultSelectedTab

        // Define the mutation handler to respond to `selected` attribute changes.
        this.handleMutation = (mutations) => {
            for (const mutation of mutations) {
                // Only process changes that add the 'selected' attribute.
                if (mutation.attributeName === "selected" && mutation.oldValue === null) {
                    const targetElement = mutation.target as Element

                    // Temporarily disconnect observer to prevent loops.
                    this.observer?.disconnect()

                    // Update tab selection state and related panel visibility.
                    this.#updateSelectedTab(targetElement)

                    // Reconnect the observer.
                    this.observer?.observe(this, MutationObserverConfig.observerOptions)

                    // Only process the first relevant mutation to avoid multiple updates.
                    break
                }
            }
        }
    }

    /**
     * Sets up component when added to the DOM.
     * Initializes tabs and panels with proper ARIA attributes and selection state.
     */
    connectedCallback() {
        super.connectedCallback()
        this.#updateSlots()
    }

    /**
     * Performs setup after the first render cycle.
     * Initializes the MutationObserver to track tab selection changes.
     */
    firstUpdated() {
        this.observer = new MutationObserver(this.handleMutation)
        this.observer?.observe(this, MutationObserverConfig.observerOptions)
    }

    /** Renders the component. */
    render() {
        return html`
            <div class="list" part="list" role="tablist" aria-label="${this.label || nothing}" @click="${this.#handleClick}" @keydown="${this.#handleKeyDown}">
                <slot name="tab"></slot>
            </div>
            <slot></slot>
        `
    }

    /**
     * Gets the default tab that should be selected upon initialization.
     * Prioritizes tabs with the 'selected' attribute, falling back to the first non-disabled tab.
     *
     * @returns The default tab element to select.
     */
    get defaultSelectedTab(): Element | null {
        return this.querySelector('wui-tab[selected]:not([disabled])') ||
               this.querySelector('wui-tab:not([disabled])')
    }

    /** Updates all tabs and panels to establish proper relationships. */
    #updateSlots() {
        this.#setupTabs()
        this.#setupPanels()
    }

    /**
     * Sets up tabs with appropriate attributes and selection state.
     * Assigns unique IDs and establishes ARIA relationships with panels.
     */
    #setupTabs() {
        this.querySelectorAll('wui-tab').forEach((tab, index) => {
            tab.slot = 'tab'
            tab.selected = tab === this.selectedTab
            tab.setAttribute('id', `${this.uid}:tab:${index + 1}`)
            tab.setAttribute('aria-controls', `${this.uid}:tab-panel:${index + 1}`)
        })
    }

    /**
     * Sets up panels with appropriate attributes and visibility.
     * Assigns unique IDs and establishes ARIA relationships with tabs.
     */
    #setupPanels() {
        const panels = this.querySelectorAll('wui-tab-panel')
        const selectedPanelId = this.selectedTab?.getAttribute('aria-controls')

        panels.forEach((panel, index) => {
            panel.setAttribute('id', `${this.uid}:tab-panel:${index + 1}`)
            panel.setAttribute('aria-labelledby', `${this.uid}:tab:${index + 1}`)
            panel.toggleAttribute('hidden', panel.getAttribute('id') !== selectedPanelId)
        })
    }

    /**
     * Handles click events on tabs.
     * Updates the selected tab when a tab is clicked.
     *
     * @param event - The click event.
     */
    #handleClick(event: MouseEvent) {
        const target = event.target as HTMLElement
        if (target.hasAttribute('disabled')) return

        if (target && target.tagName.toLowerCase() === 'wui-tab' && target !== this.selectedTab) {
            this.#updateSelectedTab(target)
        }
    }

    /**
     * Updates the selected tab and synchronizes the related panel visibility.
     *
     * @param newSelectedTab - The tab element to select.
     */
    #updateSelectedTab(newSelectedTab: Element) {
        const associatedPanel = this.querySelector(`#${CSS.escape(newSelectedTab.getAttribute('aria-controls') || '')}`)

        if (newSelectedTab !== this.selectedTab) {
            this.querySelectorAll('wui-tab').forEach((tab) => {
                tab.selected = false

                if (tab === newSelectedTab) {
                    tab.selected = true
                    tab.focus()
                    this.selectedTab = tab
                }
            })

            this.querySelectorAll('wui-tab-panel').forEach((panel) => {
                panel.toggleAttribute('hidden', panel !== associatedPanel)
            })
        }
    }

    /**
     * Handles keyboard navigation for focus movement.
     * Supports ArrowLeft, ArrowRight, Home, and End.
     */
    #handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement | null
        if (! target) return

        const item = target.closest('wui-tab')
        const group = item?.closest('wui-tab-group')

        if (group !== this) {
            return
        }

        if (['Enter', ' '].includes(e.key)) {
            if (item !== null) {
                this.#updateSelectedTab(item)
                e.preventDefault()
            }
        }

        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            const allItems = [...this.querySelectorAll('wui-tab')]
            const activeItem = allItems.find((item) => item.matches(':focus'))

            let nextItem: HTMLElement | null = null

            if (activeItem?.tagName.toLowerCase() === 'wui-tab') {
                const currentIndex = allItems.findIndex((el) => el === activeItem)

                switch (e.key) {
                    case 'Home':
                        nextItem = findNextFocusable(allItems, currentIndex, 'first')
                        break
                    case 'End':
                        nextItem = findNextFocusable(allItems, currentIndex, 'last')
                        break
                    case 'ArrowLeft':
                        nextItem = findNextFocusable(allItems, currentIndex, 'previous')
                        break
                    case 'ArrowRight':
                        nextItem = findNextFocusable(allItems, currentIndex, 'next')
                        break
                }

                if (! nextItem) return
                nextItem.focus()

                if (this.activation === 'manual') {
                    nextItem.setAttribute('tabindex', '0')
                    activeItem.setAttribute('tabindex', '-1')
                } else {
                    this.#updateSelectedTab(nextItem)
                }

                e.preventDefault()
            }
        }
    }
}
