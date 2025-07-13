import { PropertyValues, unsafeCSS } from 'lit'
import { property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { when } from 'lit/directives/when.js'
import { html } from 'lit/static-html.js'
import { BaseElement } from '../core/base-element'
import '../icon'
import { generateMods } from '../utils/mods'
import styles from './tree-item.css?inline'

/**
 * @element wui-tree-item
 */
export class TreeItem extends BaseElement {
    namespace = 'tree-item'

    static styles = [...BaseElement.styles, unsafeCSS(styles)]

    @state() level: number | null = null
    @state() posinset: number | null = null
    @state() setsize: number | null = null

    @state() collapsible: boolean = this.hasChildren
    @state() indeterminate: boolean = false
    @state() selectable: boolean = false

    @property({ type: Boolean, reflect: true }) expanded = false
    @property({ type: Boolean, reflect: true }) selected = false
    @property({ type: Boolean, reflect: true }) disabled = false

    connectedCallback() {
        super.connectedCallback()

        this.setAttribute('role', 'treeitem')
        this.setAttribute('tabindex', '-1')
        this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false')

        if (this.collapsible) {
            this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false')
        }

        if (this.isNested) {
            this.slot = 'children'
        }
    }

    handleUpdated(_changedProperties: PropertyValues) {

        if (this.level && _changedProperties.has('level')) {
            this.setAttribute('aria-level', this.level.toString())
            this.style.setProperty('--wui-tree-item-level', this.level.toString())
        }

        if (this.posinset && _changedProperties.has('posinset')) {
            this.setAttribute('aria-posinset', this.posinset.toString())
        }

        if (this.setsize && _changedProperties.has('setsize')) {
            this.setAttribute('aria-setsize', this.setsize.toString())
        }

        if (this.collapsible && _changedProperties.has('expanded')) {
            this.setAttribute('aria-expanded', this.expanded ? 'true' : 'false')
        }

        if (this.selectable && (_changedProperties.has('selectable') || _changedProperties.has('selected'))) {
            this.setAttribute('aria-selected', this.selected ? 'true' : 'false')
        }

        if (_changedProperties.has('disabled')) {
            this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false')
        }
    }

    render() {
        return html`
            <div
                class="${classMap({
                    'base': true,
                    'is-collapsible': this.collapsible,
                    'not-collapsible': !this.collapsible,
                    'is-selectable': this.selectable,
                    'not-selectable': !this.selectable,
                })}"
                part="${generateMods('base', this.#state)}"
            >
                <div class="item" part="${generateMods('item', this.#state)}">
                    ${when(this.collapsible, () => html`
                        <span
                            class="toggle"
                            part="toggle"
                            aria-hidden="true"
                            @click="${this.#toggleExpanded}"
                        >
                            <slot class="toggle-icon" name="expand-icon">
                                <wui-icon name="chevron-right" library="wui-system"></wui-icon>
                            </slot>
                            <slot class="toggle-icon" name="collapse-icon">
                                <wui-icon name="chevron-down" library="wui-system"></wui-icon>
                            </slot>
                        </span>
                    `, () => html`
                        <span class="toggle" part="toggle" aria-hidden="true"></span>
                    `)}
                    <div class="content" part="${generateMods('content', this.#state)}">
                        <slot></slot>
                    </div>
                </div>
                <div class="children" part="${generateMods('children', this.#state)}" role="group">
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

    get #state() {
        return {
            'collapsible': this.collapsible,
            'expanded': this.expanded,
            'selectable': this.selectable,
            'selected': this.selected,
            'disabled': this.disabled,
        }
    }

    #toggleExpanded(event: MouseEvent) {
        event.stopPropagation()
        this.expanded = !this.expanded
    }
}
