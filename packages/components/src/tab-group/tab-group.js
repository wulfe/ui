import { html, unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import { findNextFocusable } from '../internal/find-next-focusable'
import componentStyles from './tab-group.css?inline'

const MutationObserverConfig = {
    observerOptions: {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
      attributeFilter: ['selected']
    }
}

export class TabGroup extends BaseElement {

    static properties = {
        label: { type: String, reflect: true },
        activation: { type: String, reflect: false }
    }

    constructor() {
        super()
        this.setScope('tab-group')
        this.activation = 'auto'
        this.selectedTab = this.defaultSelectedTab

        this.handleMutation = (mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "selected" && mutation.oldValue === null) {
                    const targetElement = mutation.target

                    // Temporarily disconnect observer to prevent loops
                    this.observer?.disconnect()
                    this.updateSelectedTab(targetElement)
                    this.observer?.observe(this, MutationObserverConfig.observerOptions)
                }
            })
        }
    }

    connectedCallback() {
        super.connectedCallback()
        this.updateSlots()
    }

    firstUpdated() {
        this.observer = new MutationObserver(this.handleMutation)
        this.observer?.observe(this, MutationObserverConfig.observerOptions)
    }

    get defaultSelectedTab() {
        return this.querySelector('wui-tab[selected]:not([disabled])') || this.querySelector('wui-tab:not([disabled])')
    }

    get focusableItems() {
        return [...this.querySelectorAll('wui-tab')].filter((item) => ! item.disabled)
    }

    updateSlots() {
        this.setupTabs()
        this.setupPanels()
    }

    setupTabs() {
        this.querySelectorAll('wui-tab').forEach((tab, index) => {
            tab.slot = 'tab'
            tab.selected = tab === this.selectedTab
            tab.setAttribute('id', `${this.scope}:tab:${index + 1}`)
            tab.setAttribute('aria-controls', `${this.scope}:tab-panel:${index + 1}`)
        })
    }

    setupPanels() {
        const panels = this.querySelectorAll('wui-tab-panel')
        const selectedPanelId = this.selectedTab?.getAttribute('aria-controls')

        panels.forEach((panel, index) => {
            panel.setAttribute('id', `${this.scope}:tab-panel:${index + 1}`)
            panel.setAttribute('aria-labelledby', `${this.scope}:tab:${index + 1}`)
            panel.toggleAttribute('hidden', panel.getAttribute('id') !== selectedPanelId)
        })
    }

    handleClick(event) {
        if (event.target.disabled) return
        if (event.target && event.target.tagName.toLowerCase() === 'wui-tab' && event.target !== this.selectedTab) {
            this.updateSelectedTab(event.target)
        }
    }

    handleKeyDown(e) {
        const item = e.target.closest('wui-tab')
        const accordion = item?.closest('wui-tab-group')

        if (accordion !== this) {
            return
        }

        if (['Enter', ' '].includes(e.key)) {
            if (item !== null) {
                this.updateSelectedTab(item)
                e.preventDefault()
            }
        }

        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
            const activeItem = [...this.querySelectorAll('wui-tab')].find((item) => item.matches(':focus'))
            let nextItem = null

            if (activeItem?.tagName.toLowerCase() === 'wui-tab') {
                if (e.key === 'Home') {
                    nextItem = this.focusableItems[0]
                } else if (e.key === 'End') {
                    nextItem = this.focusableItems[this.focusableItems.length - 1]
                } else if (e.key === 'ArrowLeft') {
                    const currentIndex = [...this.querySelectorAll('wui-tab')].findIndex((el) => el === activeItem)
                    nextItem = findNextFocusable([...this.querySelectorAll('wui-tab')], this.focusableItems, currentIndex, 'previous')
                } else if (e.key === 'ArrowRight') {
                    const currentIndex = [...this.querySelectorAll('wui-tab')].findIndex((el) => el === activeItem)
                    nextItem = findNextFocusable([...this.querySelectorAll('wui-tab')], this.focusableItems, currentIndex, 'next')
                }

                if (! nextItem) {
                    return
                }

                nextItem.focus()

                if (this.activation === 'manual') {
                    nextItem.setAttribute('tabindex', '0')
                    activeItem.setAttribute('tabindex', '-1')
                } else {
                    this.updateSelectedTab(nextItem)
                }

                e.preventDefault()
            }
        }
    }

    updateSelectedTab(newSelectedTab) {
        const associatedPanel = this.querySelector(`#${CSS.escape(newSelectedTab.getAttribute('aria-controls'))}`)

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

    render() {
        return html`
            <div class="base" part="base" id="${this.scope}">
                <div class="list" part="list" role="tablist" aria-label="${this.label}" @click="${this.handleClick}" @keydown="${this.handleKeyDown}">
                    <slot name="tab"></slot>
                </div>
                <slot></slot>
            </div>
        `
    }

    static styles = [
        BaseElement.styles,
        unsafeCSS(componentStyles),
    ]
}
