import { Tree } from './tree'

if (! customElements.get('wui-tree')) {
    customElements.define('wui-tree', Tree)
}

export { Tree }

declare global {
    interface HTMLElementTagNameMap {
        'wui-tree': Tree
    }
}
