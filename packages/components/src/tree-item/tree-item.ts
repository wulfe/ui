import { PropertyValues, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { html } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import { generateMods } from '../utils/mods'
import styles from './tree-item.css?inline'

/**
 * @element wui-tree-item
 */
export class TreeItem extends BaseElement {
    namespace = 'tree-item'

    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    @state() indeterminate = false
    @state() selectable = false

    @property({ type: Boolean, reflect: true }) expanded = false
    @property({ type: Boolean, reflect: true }) selected = false
    @property({ type: Boolean, reflect: true }) disabled = false

    connectedCallback() {
        super.connectedCallback()

        this.setAttribute('role', 'treeitem')
        this.setAttribute('tabindex', '-1')
        this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false')

        if (this.hasChildren) {
            this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false')
        }

        if (this.isNested) {
            this.slot = 'children'
        }
    }

    handleUpdated(_changedProperties: PropertyValues) {

        if (_changedProperties.has('selectable')) {
            this.setAttribute('aria-selected', this.selected ? 'true' : 'false')
        }

        if (_changedProperties.has('expanded')) {
            this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false')
        }

        if (_changedProperties.has('disabled')) {
            this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false')
        }
    }

    render() {
        return html`
            <div class="base">
                <div class="item">
                    <slot></slot>
                </div>
                <div class="children" role="group">
                    <slot name="children"></slot>
                </div>
            </div>
        `
    }

    get isNested(): boolean {
        const parent = this.parentElement
        return !!parent && parent.tagName.toLowerCase() === 'wui-tree-item'
    }

    get hasChildren(): boolean {
        const items = [...this.querySelectorAll('wui-tree-item')]
        return items && items.length > 0
    }
}
