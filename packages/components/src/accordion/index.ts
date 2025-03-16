import { Accordion } from './accordion'

if (! customElements.get('wui-accordion')) {
    customElements.define('wui-accordion', Accordion)
}

export { Accordion }

declare global {
    interface HTMLElementTagNameMap {
        'wui-accordion': Accordion
    }
}
