import { html, unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import componentStyles from './tab.css?inline'

export class Tab extends BaseElement {

    static properties = {
        selected: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
    }

    constructor() {
        super()
        this.setScope('tab')
        this.selected = false
        this.disabled = false
    }

    connectedCallback() {
        super.connectedCallback()
        this.setAttribute('role', 'tab')
    }

    firstUpdated() {
        this.handleSelectedChange()
    }

    updated(changedProperties) {
        if (! this.isInitialized) {
            this.isInitialized = true
            return
        }

        if (changedProperties.has('selected') || changedProperties.has('disabled')) {
            this.handleSelectedChange()
        }
    }

    handleSelectedChange() {
        this.setAttribute('aria-selected', this.selected)
        this.setAttribute('aria-disabled', this.disabled)
        this.setAttribute('tabindex', this.selected ? '0' : '-1')
        this.toggleAttribute('selected', this.selected)
    }

    render() {
        return html`
            <div class="tab" part="tab">
                <slot></slot>
            </div>
        `;
    }

    static styles = [
        BaseElement.styles,
        unsafeCSS(componentStyles),
    ]
}
