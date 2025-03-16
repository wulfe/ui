import { unsafeCSS } from 'lit'
import { html } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import styles from './tab-panel.css?inline'

/**
 * @element wui-tab-panel
 *
 * @slot - The default slot for panel content that will be shown when the associated tab is selected.
 *
 * @part panel - The main panel container element.
 */
export class TabPanel extends BaseElement {
    namespace = 'tab-panel'

    /** Inherits styles from `BaseElement` and applies additional component-specific styles. */
    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    /**
     * Sets up ARIA attributes when the element is added to the DOM.
     * Establishes proper accessibility roles and keyboard navigability.
     */
    connectedCallback() {
        super.connectedCallback()
        this.setAttribute('role', 'tabpanel')
        this.setAttribute('tabindex', '0')
    }

    /** Renders the component. */
    render() {
        return html`
            <div class="panel" part="panel">
                <slot></slot>
            </div>
        `
    }
}
