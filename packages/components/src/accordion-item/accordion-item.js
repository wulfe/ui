import { html, unsafeCSS } from 'lit'
import { BaseElement } from '../internal/base-element'
import '../icon'
import componentStyles from './accordion-item.css?inline'

export class AccordionItem extends BaseElement {
    static styles = [
        BaseElement.styles,
        unsafeCSS(componentStyles),
    ]

    static properties = {
        __collapsible: { state: true },
        expanded: { type: Boolean, reflect: true, attribute: 'open' },
        disabled: { type: Boolean, reflect: true },
        heading: { type: String, reflect: true },
        headingLevel: { type: String, reflect: true, attribute: 'heading-level' },
    }

    constructor() {
        super()
        this.setScope('accordion-item')
        this.__collapsible = true
        this.expanded = false
        this.disabled = false
        this.heading = null
        this.headingLevel = null
    }

    updated(changedProperties) {
        super.updated(changedProperties)
        this.#handleEvents(changedProperties)
    }

    #headerTemplate() {
        return html`
            <div class="header" part="header" id="${this.scope}:header" role="heading" aria-level="${this.headingLevel ?? 2}">
                ${this.#triggerTemplate()}
            </div>
        `
    }

    #triggerTemplate() {
        return html`
            <button class="trigger" part="trigger" id="${this.scope}:trigger" type="button" aria-controls="${this.scope}:panel" aria-expanded="${this.expanded}" aria-disabled="${! this.collapsible}" ?disabled="${this.disabled}" @click="${this.#handleClick}">
                <slot class="heading" part="heading" id="heading" name="heading">${this.heading}</slot>
                ${this.#iconTemplate()}
            </button>
        `
    }

    #iconTemplate() {
        return html`
            <span class="trigger-icon" part="trigger-icon">
                <slot name="expand-icon">
                    <wui-icon name="chevron-down" library="wui-system"></wui-icon>
                </slot>
                <slot name="collapse-icon">
                    <wui-icon name="chevron-up" library="wui-system"></wui-icon>
                </slot>
            </span>
        `
    }

    #panelTemplate() {
        return html`
            <div class="panel" part="panel" id="${this.scope}:panel" role="region" aria-labelledby="${this.scope}:trigger">
                <slot></slot>
            </div>
        `
    }

    render() {
        return html`
            <div class="base" part="base" id="${this.scope}">
                ${this.#headerTemplate()}
                ${this.#panelTemplate()}
            </div>
        `
    }

    toggle() {
        if (! this.collapsible) return
        this.expanded = ! this.expanded
    }

    open() {
        if (! this.collapsible) return
        if (this.expanded) return
        this.expanded = true
    }

    close() {
        if (! this.collapsible) return
        if (! this.expanded) return
        this.expanded = false
    }

    disable() {
        if (this.disabled) return
        this.disabled = true
    }

    enable() {
        if (! this.disabled) return
        this.disabled = false
    }

    get collapsible() {
        return ! this.disabled && this.__collapsible
    }

    #handleClick() {
        this.toggle()
    }

    #handleEvents(changedProperties) {
        if (! this.isInitialized) {
            this.isInitialized = true
            return
        }

        if (changedProperties.has('expanded')) {
            this.addEvent(this.expanded ? 'open' : 'close')
        }

        if (changedProperties.has('disabled')) {
            this.addEvent(this.disabled ? 'disable' : 'enable')
        }

        this.queueEvents()
    }
}
