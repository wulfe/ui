import { PropertyValues, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { html, unsafeStatic } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import { HeadingLevel } from '../core/types'
import '../icon'
import { getHeadingTag, validateHeadingLevel } from '../utils/heading'
import { generateMods } from '../utils/mods'
import styles from './accordion-item.css?inline'

/**
 * @element wui-accordion-item
 *
 * @fires wui-change - Dispatched when the accordion item is expanded, collapsed or disabled.
 *
 * @slot The default slot for the content panel.
 * @slot heading - The slot for the accordion item's heading text.
 * @slot expand-icon - The slot for the icon displayed when the item is collapsed.
 * @slot collapse-icon - The slot for the icon displayed when the item is expanded.
 *
 * @part header - The header section of the accordion item. Modifiers: open, disabled, collapsible.
 * @part trigger - The button that toggles the accordion item's state. Modifiers: open, disabled, collapsible.
 * @part heading - The heading text within the trigger. Modifiers: open, disabled, collapsible.
 * @part icon - The icon within the trigger. Modifiers: open, disabled, collapsible.
 * @part panel - The content panel of the accordion item. Modifiers: open, disabled, collapsible.
 */
export class AccordionItem extends BaseElement {
    namespace = 'accordion-item'

    /** Inherits styles from `BaseElement` and applies additional component-specific styles. */
    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /** Default heading level used if `heading-level` attribute is invalid or missing. */
    private static readonly DEFAULT_HEADING_LEVEL: HeadingLevel = 2

    /** Internal state for heading level, defaults to 2. */
    @state() _headingLevel: HeadingLevel = AccordionItem.DEFAULT_HEADING_LEVEL

    /** Internal state to track if item can be collapsed. */
    @state() _collapsible = true

    /**
     * Whether the accordion item is currently expanded.
     * @attr open - Reflects to the `open` attribute in HTML.
    */
    @property({ type: Boolean, reflect: true, attribute: 'open' }) expanded = false

    /**
     * Whether the accordion item is disabled (cannot be interacted with).
     * @attr disabled - Reflects to the `disabled` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true }) disabled = false

    /**
     * The text content of the accordion item's header.
     * @attr heading
     */
    @property({ type: String }) heading?: string

    /**
     * Sets the heading level (h1-h6) for the accordion item's header.
     * @attr heading-level
     */
    @property({ type: Number, attribute: 'heading-level' })
    set headingLevel(level: number) {
        const validatedHeadingLevel = validateHeadingLevel(level, AccordionItem.DEFAULT_HEADING_LEVEL)
        if (this._headingLevel !== validatedHeadingLevel) {
            this._headingLevel = validatedHeadingLevel
        }
    }

    /**
     * Handles property updates.
     *
     * This method is a hook called from the `BaseElement`'s `updated()` lifecycle method.
     * It only executes after the component has been initialized (i.e., after the first update cycle).
     *
     * @param _changedProperties - A map of changed properties and their previous values.
     */
    handleUpdated(_changedProperties: PropertyValues) {
        if (_changedProperties.has('expanded') || _changedProperties.has('disabled')) {
            this.addEvent({
                name: 'change',
                detail: {
                    open: this.expanded,
                    disabled: this.disabled,
                    collapsible: this.collapsible,
                },
            })
        }

        this.queueEvents()
    }

    /** Renders the component.*/
    render() {
        return html`
            ${this.#headerTemplate()}
            ${this.#panelTemplate()}
        `
    }

    /** Toggles the expanded state of the accordion item. */
    toggle() {
        if (! this.collapsible) return
        this.expanded = ! this.expanded
    }

    /** Opens the accordion item. */
    open() {
        if (! this.collapsible) return
        if (this.expanded) return
        this.expanded = true
    }

    /** Closes the accordion item. */
    close() {
        if (! this.collapsible) return
        if (! this.expanded) return
        this.expanded = false
    }

    /** Disables the accordion item. */
    disable() {
        if (this.disabled) return
        this.disabled = true
    }

    /** Enables the accordion item. */
    enable() {
        if (! this.disabled) return
        this.disabled = false
    }

    /** Gets whether the accordion item is collapsible (can be interacted with). */
    get collapsible(): boolean {
        return this._collapsible && ! this.disabled
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
            'open': this.expanded,
            'disabled': this.disabled,
            'collapsible': this.collapsible,
        }
    }

    /** Handles the click event on the trigger button. */
    #handleClick() {
        this.toggle()
    }

    /** Renders the header section of the accordion item. */
    #headerTemplate() {
        const headingTag = unsafeStatic(getHeadingTag(this.headingLevel))

        return html`
            <${headingTag} part="${generateMods('header', this.#state)}" class="header">
                ${this.#triggerTemplate()}
            </${headingTag}>
        `
    }

    /** Renders the trigger button for the accordion item. */
    #triggerTemplate() {
        return html`
            <button
                part="${generateMods('trigger', this.#state)}"
                class="trigger"
                id="${this.uid}:trigger"
                type="button"
                aria-controls="${this.uid}:panel"
                aria-expanded="${this.expanded}"
                aria-disabled="${! this.collapsible}"
                ?disabled="${this.disabled}"
                @click="${this.#handleClick}"
            >
                <slot part="${generateMods('heading', this.#state)}" class="heading" name="heading">${this.heading}</slot>
                ${this.#iconTemplate()}
            </button>
        `
    }

    /** Renders the expand/collapse icons. */
    #iconTemplate() {
        return html`
            <span part="${generateMods('icon', this.#state)}" class="icon">
                <slot name="expand-icon">
                    <wui-icon name="chevron-down" library="wui-system"></wui-icon>
                </slot>
                <slot name="collapse-icon">
                    <wui-icon name="chevron-up" library="wui-system"></wui-icon>
                </slot>
            </span>
        `
    }

    /** Renders the content panel of the accordion item. */
    #panelTemplate() {
        return html`
            <div
                part="${generateMods('panel', this.#state)}"
                class="panel"
                id="${this.uid}:panel"
                role="region"
                aria-labelledby="${this.uid}:trigger"
            >
                <slot></slot>
            </div>
        `
    }
}
