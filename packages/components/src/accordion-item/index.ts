import { AccordionItem } from './accordion-item'

if (! customElements.get('wui-accordion-item')) {
    customElements.define('wui-accordion-item', AccordionItem)
}

export { AccordionItem }

declare global {
    interface HTMLElementTagNameMap {
        'wui-accordion-item': AccordionItem
    }
}
