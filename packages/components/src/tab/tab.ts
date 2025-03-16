import { PropertyValues, unsafeCSS } from 'lit'
import { property } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import { generateMods } from '../utils/mods'
import styles from './tab.css?inline'

/**
 * @element wui-tab
 *
 * @slot - The default slot for tab content.
 *
 * @part tab - The main tab container element. Modifiers: selected, disabled.
 */
export class Tab extends BaseElement {
    namespace = 'tab'

    /** Inherits styles from `BaseElement` and applies additional component-specific styles. */
    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /**
     * Whether the tab is currently selected.
     * @attr selected - Reflects to the `selected` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true }) selected = false

    /**
     * Whether the tab is disabled (cannot be interacted with).
     * @attr disabled - Reflects to the `disabled` attribute in HTML.
     */
    @property({ type: Boolean, reflect: true }) disabled = false

    /** Sets up initial ARIA attributes when the element is added to the DOM. */
    connectedCallback() {
        super.connectedCallback()
        this.setAttribute('role', 'tab')
    }

    /** Performs initial setup after the first render cycle. */
    firstUpdated() {
        this.#handleSelectedChange()
    }

    /**
     * Handles property updates.
      * Ensures correct attributes state when `selected` or `disabled` change.
     */
    handleUpdated(_changedProperties: PropertyValues) {
        if (_changedProperties.has('selected') || _changedProperties.has('disabled')) {
            this.#handleSelectedChange()
        }
    }

    /** Renders the component. */
    render() {
        return html`
            <div class="tab" part="${generateMods('tab', this.#state)}">
                <slot></slot>
            </div>
        `;
    }

    /** Updates ARIA attributes and tabindex based on the current selected and disabled states. */
    #handleSelectedChange() {
        this.setAttribute('aria-selected', this.selected.toString())
        this.setAttribute('aria-disabled', this.disabled.toString())
        this.setAttribute('tabindex', this.selected ? '0' : '-1')
        this.toggleAttribute('selected', this.selected)
    }

    /**
     * Gets the current state of the tab as an object.
     *
     * This getter encapsulates the component's state properties (selected, disabled)
     * into a single object, making it easier to pass to the `generateMods` function for
     * dynamic `part` attribute generation.
     *
     * @returns An object containing the current state of the tab.
     */
    get #state(): Record<string, boolean> {
        return {
            'selected': this.selected,
            'disabled': this.disabled,
        }
    }
}
