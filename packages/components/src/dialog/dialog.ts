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

// Keep track of all open dialogs.
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

    /** Reference to the backdrop element. */
    @query('.backdrop') _backdropElement!: HTMLElement

    /** Reference to the wrapper element. */
    @query('.wrapper') _wrapperElement!: HTMLElement

    /** Reference to the dialog element. */
    @query('.dialog') _dialogElement!: HTMLElement

    /** Array to store elements that should be made inert when the dialog is open. */
    #inertElements: HTMLElement[] = []

    /** Stores the last focused element before the dialog was opened. */
    #lastFocusedElement: HTMLElement | null = null

    /** Array to store elements with `data-dialog-close` attribute. */
    #dataCloseElements: HTMLElement[] = []

    /** Flag to track if the dialog is currently transitioning. */
    #isTransitioning: boolean = false

    /** Listener for document-level keydown events (specifically for Esc key). */
    static #documentKeydownListener: ((e: KeyboardEvent) => void) | null = null

    /** Tracks how many dialog instances exist to manage the global keydown listener. */
    static #listenerCount: number = 0

    /** Handles the document-level keydown event for Esc key press to close the topmost dialog. */
    static {
        Dialog.#documentKeydownListener = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && openDialogs.length > 0) {
                // Get the topmost dialog.
                const topDialog = openDialogs[openDialogs.length - 1]

                // Check if it is dismissable.
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
                if (! this.#isTransitioning) {
                    this.#handleHide()
                }
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
            <div part="${generateMods('backdrop', this.#state)}" class="backdrop" tabindex="-1"></div>
            <div
                part="${generateMods('wrapper', this.#state)}"
                class="wrapper"
                tabindex="0"
                @click="${this.#onBackdropClick}"
            >
                <div
                    part="${generateMods('dialog', this.#state)}"
                    class="dialog"
                    role="document"
                    @keydown="${this.#handleKeyDown}"
                >
                    ${this.#renderHeaderTemplate()}
                    ${this.#renderBodyTemplate()}
                    ${this.#renderFooterTemplate()}
                </div>
            </div>
        `
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
                        <slot name="header-close-label"></slot>
                        <slot name="header-close-icon">
                            <wui-icon name="x" library="wui-system" label="Close dialog"></<wui-icon>
                        </slot>
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

    /** Opens the dialog. */
    show() {
        if (this.open) return
        this.open = true
    }

    /** Closes the dialog. */
    hide() {
        if (! this.open) return
        this.#handleHide()
    }

    /** Handles the dialog's open state, including transitions and focus management. */
    async #handleShow() {
        if (this.#isTransitioning) return
        this.#isTransitioning = true

        // Add transition classes.
        this.classList.add('wui-on-transition-enter', 'wui-on-transition-enter-start')

         // Force reflow to ensure transition starts.
        this.offsetHeight

        // Prevent scrolling on the document body to avoid content shifting.
        document.body.style.overflow = 'hidden'

        // Store the element that had focus before the dialog was opened, for later restoration.
        this.#lastFocusedElement = getActiveEl() as HTMLElement

        // Add the dialog to the openDialogs array.
        openDialogs.push(this)

        // Remove all previous inerts.
        openDialogs.forEach((dialog) => {
            dialog.#inertElements.forEach((element) => element.removeAttribute('inert'))
            dialog.#inertElements = []
        })

        // Make elements outside the dialog inert to prevent interaction while the dialog is open.
        this.#inertElements = this.#getElementsToInert()
        this.#inertElements.forEach((element) => element.setAttribute('inert', ''))

        // Update the level and offset of each open dialog.
        this.#updateLevelAndOffset()

        requestAnimationFrame(() => {
            // Update transition classes.
            this.classList.remove('wui-on-transition-enter-start')
            this.classList.add('wui-on-transition-enter-end')

            // Wait for all transitions *outside* requestAnimationFrame.
            this.#waitForEnterTransitions()
                .then(() => {
                    this.#isTransitioning = false // Reset flag after transition completes
                })
        })
    }

    /** Waits for enter transition animations to complete before finalizing the show state. */
    async #waitForEnterTransitions() {
        const elements = this.#getTransitionableElements()
        if (elements.length === 0) {
            this.#handleShowAfter() // Fallback if no elements to transition
            return
        }

        try {
            const animations = elements.flatMap(el => el.getAnimations())
            if (animations.length === 0) {
                this.#handleShowAfter() // Fallback if element has no transitions
                return;
            }

            await Promise.allSettled(elements.map(el => this.#onTransitionEnd(el)))
            this.#handleShowAfter() // Ensures it's called after all transitions
        } catch (error) {
            console.error('Transition error:', error)
        }
    }

    /** Finalizes the dialog's open state after transitions complete. */
    #handleShowAfter() {
        // Update transition classes.
        this.classList.remove('wui-on-transition-enter', 'wui-on-transition-enter-end')

        // Focus the first element, either `[autofocus]` or the dialog.
        this.#focusFirstElement()
    }

    /** Handles the dialog's closed state, including transitions and cleanup. */
    async #handleHide() {
        if (this.#isTransitioning) return
        this.#isTransitioning = true

        // Add transition classes.
        this.classList.add('wui-on-transition-leave', 'wui-on-transition-leave-start')

        // Force reflow to ensure transition starts.
        this.offsetHeight

        // Remove the dialog from the openDialogs array and remove the CSS variables.
        this.#removeClosingDialog()

        // Update the level and offset of each open dialog.
        this.#updateLevelAndOffset()

        requestAnimationFrame(() => {
            // Update transition classes.
            this.classList.remove('wui-on-transition-leave-start')
            this.classList.add('wui-on-transition-leave-end')

            // Wait for all transitions *outside* requestAnimationFrame.
            this.#waitForLeaveTransitions()
                .then(() => {
                    this.#isTransitioning = false // Reset flag after transition completes
                })
        })
    }

    /** Waits for leave transition animations to complete before finalizing the hide state. */
    async #waitForLeaveTransitions() {
        const elements = this.#getTransitionableElements()
        if (elements.length === 0) {
            this.#handleHideAfter() // Fallback if no elements to transition
            return
        }

        try {
            const animations = elements.flatMap(el => el.getAnimations())
            if (animations.length === 0) {
                this.#handleHideAfter() // Fallback if element has no transitions
                return
            }

            await Promise.allSettled(elements.map(el => this.#onTransitionEnd(el)))
            this.#handleHideAfter() // Ensures it's called after all transitions
        } catch (error) {
            console.error('Transition error:', error)
        }
    }

    /** Finalizes the dialog's closed state after transitions complete. */
    #handleHideAfter() {
        // Update transition classes.
        this.classList.remove('wui-on-transition-leave', 'wui-on-transition-leave-end')

        // Close the dialog.
        this.open = false

        // Clean up and restore the state after the dialog is closed.
        this.#cleanupAfterClose()
    }

    /** Waits for all animations on a given node to finish. */
    #onTransitionEnd(node: HTMLElement): Promise<PromiseSettledResult<Animation>[]> {
        return Promise.allSettled(
            node.getAnimations().map(animation => animation.finished)
        )
    }

    /** Cleans up the dialog's state after it is closed. */
    #cleanupAfterClose() {
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
        if (this.dismissable && event.target === this._wrapperElement) {
            this.hide()
        }
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
            this._wrapperElement.focus()
        }
    }

    /** Remove the dialog from the openDialogs array and remove the CSS variables. */
    #removeClosingDialog() {
        const index = openDialogs.indexOf(this)
        if (index !== -1) {
            openDialogs.splice(index, 1)
            this.style.removeProperty('--wui-dialog-level')
            this.style.removeProperty('--wui-dialog-offset')
        }
    }

    /** Update the level and offset of each open dialog. */
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

    /** Gets elements that have transitions applied for animation handling. */
    #getTransitionableElements(): HTMLElement[] {
        const shadowRoot = this.shadowRoot
        if (! shadowRoot) return []

        return [
            shadowRoot.querySelector('.backdrop') as HTMLElement,
            shadowRoot.querySelector('.dialog') as HTMLElement,
        ].filter(el => el !== null) // Filter out nulls in case an element isn’t found
    }
}
