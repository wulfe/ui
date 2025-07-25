import { TreeItem } from './tree-item'

if (! customElements.get('wui-tree-item')) {
    customElements.define('wui-tree-item', TreeItem)
}

export { TreeItem }

declare global {
    interface HTMLElementTagNameMap {
        'wui-tree-item': TreeItem
    }
}
