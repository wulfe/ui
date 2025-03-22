import { PropertyValues, unsafeCSS } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { html, unsafeStatic } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import { HeadingLevel } from '../core/types'
import '../icon'
import { getHeadingTag, validateHeadingLevel } from '../utils/heading'
import { generateMods } from '../utils/mods'
import { getActiveEl } from '../utils/dom'
import { tabbable } from 'tabbable'
import { findNextFocusable } from '../utils/focus'
import styles from './dialog.css?inline'

let openDialogs: Dialog[] = []

/**
 * @element wui-dialog
 */
export class Dialog extends BaseElement {
    namespace = 'dialog'

    /** Inherits styles from `BaseElement` and applies additional component-specific styles. */
    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /** Default heading level used if `heading-level` attribute is invalid or missing. */
    private static readonly DEFAULT_HEADING_LEVEL: HeadingLevel = 2

    /** Internal state for heading level, defaults to 2. */
    @state() _headingLevel: HeadingLevel = Dialog.DEFAULT_HEADING_LEVEL

    /**
     * Whether the dialog is currently open.
     * @attr open - Reflects to the `open` attribute in HTML.
    */
    @property({ type: Boolean, reflect: true }) open = false

    /**
     * Whether the dialog is scrollable internally.
     * @attr scrollable - Reflects to the `scrollable` attribute in HTML.
    */
    @property({ type: Boolean, reflect: true }) scrollable = false

    /**
     * Whether the dialog can be dismissed with close button, Esc key, or backdrop click.
     * @attr dismissable - Reflects to the `dismissable` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true }) dismissable = false

    /**
     * Whether to display the dialog header.
     * @attr with-header - Reflects to the `with-header` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true, attribute: 'with-header' }) withHeader = false

    /**
     * Whether to display the dialog footer.
     * @attr with-footer - Reflects to the `with-footer` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true, attribute: 'with-footer' }) withFooter = false

    /**
     * The text content of the dialog's header.
     * @attr heading
     */
    @property({ type: String }) heading?: string

    /**
     * Sets the heading level (h1-h6) for the dialog's header.
     * @attr heading-level
     */
    @property({ type: Number, attribute: 'heading-level' })
    set headingLevel(level: number) {
        const validatedHeadingLevel = validateHeadingLevel(level, Dialog.DEFAULT_HEADING_LEVEL)
        if (this._headingLevel !== validatedHeadingLevel) {
            this._headingLevel = validatedHeadingLevel
        }
    }

    /** Reference to the dialog's main container element. */
    @query('.dialog') _dialogElement!: HTMLElement

    /** Reference to the backdrop element. */
    @query('.backdrop') _backdropElement!: HTMLElement

    /** Array to store elements that should be made inert when the dialog is open. */
    #inertElements: HTMLElement[] = []

    /** Stores the last focused element before the dialog was opened. */
    #lastFocusedElement: HTMLElement | null = null

    /** Array to store elements with `data-dialog-close` attribute. */
    #dataCloseElements: HTMLElement[] = []

    /** Listener for document-level keydown events (specifically for Esc key). */
    static #documentKeydownListener: ((e: KeyboardEvent) => void) | null = null
    static #listenerCount: number = 0 // Track how many dialog instances exist

    static {
        Dialog.#documentKeydownListener = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && openDialogs.length > 0) {
                // Get the topmost dialog
                const topDialog = openDialogs[openDialogs.length - 1]

                // Check if it is dismissable
                if (topDialog.open && topDialog.dismissable) {
                    topDialog.hide()
                    event.preventDefault()
                }
            }
        }

        // Add the listener at the document level.
        document.addEventListener('keydown', Dialog.#documentKeydownListener)
    }

    /** Lifecycle callback: Called when the element is connected to the DOM. */
    connectedCallback(): void {
        super.connectedCallback()
        this.setAttribute('role', this.dismissable ? 'dialog' : 'alertdialog')
        this.setAttribute('aria-modal', 'true')
        this.setAttribute('tabindex', '-1')

        // Add listener if this is the first dialog instance.
        Dialog.#listenerCount++
        if (Dialog.#listenerCount === 1 && Dialog.#documentKeydownListener) {
            document.addEventListener('keydown', Dialog.#documentKeydownListener)
        }

        // Find and set up data-dialog-close elements.
        this.#setupDataCloseElements()

        // Set aria-label from heading if not already set.
        if (this.heading && (! this.hasAttribute('aria-label') && ! this.hasAttribute('aria-labelledby'))) {
            this.setAttribute('aria-label', this.heading)
        }
    }

    /** Lifecycle callback: Called when the element is disconnected from the DOM. */
    disconnectedCallback(): void {
        // Decrement counter and remove listener if this is the last dialog.
        Dialog.#listenerCount--
        if (Dialog.#listenerCount === 0 && Dialog.#documentKeydownListener) {
            document.removeEventListener('keydown', Dialog.#documentKeydownListener)
        }

        // Clean up dialog state.
        this.#handleHide()

        super.disconnectedCallback()
    }

    /**
     * Handles property updates.
     *
     * This method is a hook called from the `BaseElement`'s `updated()` lifecycle method.
     * It only executes after the component has been initialized (i.e., after the first update cycle).
     *
     * @param _changedProperties - A map of changed properties and their previous values.
     */
    handleUpdated(_changedProperties: PropertyValues): void {
        if (_changedProperties.has('dismissable')) {
            this.setAttribute('role', this.dismissable ? 'dialog' : 'alertdialog')
        }

        if (_changedProperties.has('open')) {
            if (this.open) {
                this.#handleShow()
            } else {
                this.#handleHide()
            }

            this.addEvent({
                name: this.open ? 'show' : 'hide',
            })
        }

        this.queueEvents()
    }

    /** Renders the component. */
    render() {
        return html`
            <div
                part="${generateMods('backdrop', this.#state)}"
                class="backdrop"
                @click="${this.#onBackdropClick}"
            >
                <div
                    part="${generateMods('dialog', this.#state)}"
                    class="dialog"
                    role="document"
                    tabindex="0"
                    @keydown="${this.#handleKeyDown}"
                >
                    ${this.#renderHeaderTemplate()}
                    ${this.#renderBodyTemplate()}
                    ${this.#renderFooterTemplate()}
                </div>
            </div>
        `
    }

    /** Opens the dialog. */
    show() {
        if (this.open) return
        this.open = true
    }

    /** Closes the dialog. */
    hide() {
        if (! this.open) return
        this.open = false
    }

    /** Gets the current heading level. */
    get headingLevel(): HeadingLevel {
        return this._headingLevel
    }

    /**
     * Gets the current state of the accordion item as an object.
     *
     * This getter encapsulates the component's state properties (expanded, disabled, collapsible)
     * into a single object, making it easier to pass to the `generateMods` function for
     * dynamic `part` attribute generation.
     *
     * @returns An object containing the current state of the accordion item.
     */
    get #state() {
        return {
            'open': this.open,
            'scrollable': this.scrollable,
            'dismissable': this.dismissable,
            'with-header': this.withHeader,
            'with-footer': this.withFooter,
        }
    }

    /** Renders the header section of the dialog. */
    #renderHeaderTemplate() {
        const headingTag = unsafeStatic(getHeadingTag(this.headingLevel))

        return html`
            ${this.withHeader ? html`
                <div part="${generateMods('header', this.#state)}" class="header">
                    <${headingTag} part="${generateMods('heading', this.#state)}" class="heading">
                        ${this.heading}
                    </${headingTag}>

                    ${this.#renderHeaderActionsTemplate()}
                </div>
            ` : ''}
        `
    }

    /** Renders the header actions of the dialog. */
    #renderHeaderActionsTemplate() {
        return html`
            <div part="${generateMods('header-actions', this.#state)}" class="header-actions">
                <slot name="header-actions"></slot>
                ${this.dismissable ? html`
                    <button part="${generateMods('header-close', this.#state)}" class="header-close" type="button" @click="${this.hide}">
                        <wui-icon name="x" library="wui-system" label="Close dialog"></<wui-icon>
                    </button>
                ` : ''}
            </div>
        `
    }

    /** Renders the body section of the dialo. */
    #renderBodyTemplate() {
        return html`
            <div part="${generateMods('body', this.#state)}" class="body">
                <slot></slot>
            </div>
        `
    }

    /** Renders the footer section of the dialo. */
    #renderFooterTemplate() {
        return html`
            ${this.withFooter ? html`
                <div part="${generateMods('footer', this.#state)}" class="footer">
                    <slot name="footer"></slot>
                </div>
            ` : ''}
        `
    }

    /** Handles the dialog's open state. */
    #handleShow() {
        // Store the element that had focus before the dialog was opened, for later restoration.
        this.#lastFocusedElement = getActiveEl() as HTMLElement

        // Add the dialog to the openDialogs array.
        openDialogs.push(this)

        console.debug('Dialog opened:', this.id, 'openDialogs:', openDialogs.map(d => d.id))

        // Remove all previous inerts.
        openDialogs.forEach((dialog) => {
            dialog.#inertElements.forEach((element) => element.removeAttribute('inert'))
            dialog.#inertElements = []
        })

        // Make elements outside the dialog inert to prevent interaction while the dialog is open.
        this.#inertElements = this.#getElementsToInert()
        this.#inertElements.forEach((element) => element.setAttribute('inert', ''))

        // Prevent scrolling on the document body to avoid content shifting.
        document.body.style.overflow = 'hidden'

        // Execute focus and setup tasks after the next microtask to ensure the dialog is fully rendered.
        queueMicrotask(() => {
            this.#focusFirstElement()
            this.#setupDataCloseElements()
            this.#updateLevelAndOffset()
        })
    }

    /** Handles the dialog's closed state. */
    #handleHide() {
        // Clean up and restore the state after the dialog is closed.
        this.#cleanupAfterClose()
    }

    /** Gets elements to make inert when dialog opens. */
    #getElementsToInert(): HTMLElement[] {
        const elements: HTMLElement[] = []
        let currentParent = this.parentElement

        if (! currentParent) return elements

        // Traverse up the DOM tree from the dialog's parent to the body.
        while (currentParent && currentParent !== document.body) {
            const parentOfCurrent = currentParent.parentElement as HTMLElement
            if (parentOfCurrent) {
                // Collect siblings of the current parent (excluding the parent itself).
                const siblings = Array.from(parentOfCurrent.children)
                    .filter((child) => child !== currentParent) as HTMLElement[]
                elements.push(...siblings)
            }
            // Move to the next parent up the tree.
            currentParent = parentOfCurrent
        }

        // Include direct siblings of the dialog within its immediate parent.
        if (this.parentElement) {
            const directSiblings = Array.from(this.parentElement.children)
                .filter((child) => child !== this) as HTMLElement[]
            elements.push(...directSiblings)
        }

        return elements
    }

    /** Handles keydown events for focus trapping within the dialog. */
    #handleKeyDown(event: KeyboardEvent) {
        if (['Tab'].includes(event.key)) {
            let nextItem: HTMLElement | null = null

            // Prevent tabbing if there are no focusable elements.
            if (! this.#focusableElements.length) {
                event.preventDefault()
                return
            }

            // Find the currently focused element and its index in the focusable elements array.
            const activeItem = this.#focusableElements.find((item) => item.matches(':focus'))
            const currentIndex = this.#focusableElements.findIndex((el) => el === activeItem)

            if (event.key === 'Tab') {
                nextItem = findNextFocusable(this.#focusableElements, currentIndex, 'next')

                if (event.shiftKey) {
                    nextItem = findNextFocusable(this.#focusableElements, currentIndex, 'previous')
                }
            }

            // Focus the next element and prevent default tab behavior.
            if (nextItem) {
                nextItem.focus()
                event.preventDefault()
            }
        }
    }

    /** Handles clicks on the backdrop element. */
    #onBackdropClick(event: MouseEvent) {
        // Only close if clicking directly on the backdrop (not its children).
        if (this.dismissable && event.target === this._backdropElement) {
            this.hide()
        }
    }

    /** Sets up event listeners for elements with data-dialog-close attribute. */
    #setupDataCloseElements() {
        // Clean up any previous listeners first.
        this.#cleanupDataCloseElements()

        // Find all elements with data-dialog-close attribute.
        const closeElements = Array.from(this.querySelectorAll('[data-dialog-close]')) as HTMLElement[]

        closeElements.forEach(element => {
            const closeHandler = () => this.hide()
            element.addEventListener('click', closeHandler)

            // Store reference to element and its handler for cleanup.
            this.#dataCloseElements.push(element)
        })
    }

    /** Cleans up event listeners for elements with data-dialog-close attribute. */
    #cleanupDataCloseElements() {
        this.#dataCloseElements.forEach(element => {
            const closeHandler = () => this.hide()
            element.removeEventListener('click', closeHandler)
        })

        this.#dataCloseElements = []
    }

    /** Cleans up the dialog's state after it is closed. */
    #cleanupAfterClose() {
        // Remove the dialog from the openDialogs array and remove the CSS variables.
        const index = openDialogs.indexOf(this)
        if (index !== -1) {
            openDialogs.splice(index, 1)
            this.style.removeProperty('--wui-dialog-level')
            this.style.removeProperty('--wui-dialog-offset')
        }

        console.debug('Dialog closed:', this.id, 'openDialogs:', openDialogs.map(d => d.id))

        // Update the level and offset of open dialogs.
        this.#updateLevelAndOffset()

        // Remove inerts from the closed dialog.
        this.#inertElements.forEach((element) => element.removeAttribute('inert'))
        this.#inertElements = []

        // Re-apply inertness if there are still open dialogs.
        if (openDialogs.length > 0) {
            // Re-apply inertness based on the latest open dialog.
            const lastOpenDialog = openDialogs[openDialogs.length - 1]
            lastOpenDialog.#inertElements = lastOpenDialog.#getElementsToInert()
            lastOpenDialog.#inertElements.forEach((element) => element.setAttribute('inert', ''))
        }

        // Only restore body scrolling if no dialogs are left open.
        if (openDialogs.length === 0) {
            document.body.style.overflow = ''
        }

        // Restore focus to the element that had focus before the dialog was opened.
        if (this.#lastFocusedElement && typeof this.#lastFocusedElement.focus === 'function') {
            this.#lastFocusedElement.focus()
        }
        this.#lastFocusedElement = null

        // Clean up data-dialog-close elements.
        this.#cleanupDataCloseElements()
    }

    /** Focuses the first focusable element within the dialog. */
    #focusFirstElement() {
        let autofocusElements: HTMLElement[] = []

        // First check for [autofocus] elements.
        this.#focusableElements.forEach((element) => {
            if (element.hasAttribute('autofocus') && element instanceof HTMLElement) {
                autofocusElements.push(element)
            }
        })

        if (autofocusElements.length) {
            autofocusElements[0].focus()
        } else {
            // If no autofocus element, focus the dialog itself.
            this._dialogElement.focus()
        }
    }

    // Update the level and offset of each open dialog.
    #updateLevelAndOffset() {
        openDialogs.forEach((el, index) => {
            const level = index + 1
            const offset = openDialogs.length - level
            el.style.setProperty('--wui-dialog-level', level.toString())
            el.style.setProperty('--wui-dialog-offset', offset.toString())
        })
    }

    /** Gets an array of focusable elements within the dialog. */
    get #focusableElements() {
        return tabbable(this._dialogElement, { getShadowRoot: true }) as HTMLElement[]
    }
}
