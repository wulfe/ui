import { Dialog } from './dialog'

if (! customElements.get('wui-dialog')) {
    customElements.define('wui-dialog', Dialog)
}

export { Dialog }

declare global {
    interface HTMLElementTagNameMap {
        'wui-dialog': Dialog
    }
}
