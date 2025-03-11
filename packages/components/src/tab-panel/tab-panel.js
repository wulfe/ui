import { html, unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import componentStyles from './tab-panel.css?inline'

export class TabPanel extends BaseElement {

    constructor() {
        super()
        this.setScope('tab-panel')
    }

    connectedCallback() {
        super.connectedCallback()
        this.setAttribute('role', 'tabpanel')
        this.setAttribute('tabindex', '0')
    }

    render() {
        return html`
            <div class="panel" part="panel">
                <slot></slot>
            </div>
        `
    }

    static styles = [
        BaseElement.styles,
        unsafeCSS(componentStyles),
    ]
}
