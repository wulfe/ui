import { unsafeCSS, LitElement } from 'lit'
import { uid } from './uid'
import { emitEvent } from './emit-event'
import preflightStyles from '@wulfe/ui-css/preflight.css?inline'

export class BaseElement extends LitElement {
    #events = []

    static styles = [
        unsafeCSS(preflightStyles),
    ]

    constructor() {
        super()
        this.__namespace = 'component'
        this.__scope = `wui-${this.namespace}`
        this.__isInitialized = false
    }

    addEvent(name, detail = null, options = {}) {
        this.#events.push({ name, detail, options })
    }

    emitEvent(name, detail = null, options = {}) {
        try {
            detail = {
                ...detail,
                namespace: this.namespace,
                scope: this.scope,
                timestamp: new Date().toISOString(),
            }
            return emitEvent(this, name, detail, options)
        } catch (error) {
            console.error(`Failed to emit event: ${name}`, error)
            return false
        }
    }

    queueEvents() {
        if (! this.#events.length) return

        Promise.resolve().then(() => {
            this.#events.forEach(({ name, detail = null, options = {} }) => {
                this.emitEvent(name, detail, options)
            })

            this.#events = []
        })
    }

    setScope(value, length = 8) {
        if (! value) return
        this.__namespace = `wui-${value}`
        this.__scope = uid(this.__namespace, length)
    }

    get namespace() {
        return this.__namespace
    }

    get scope() {
        return this.__scope
    }

    set isInitialized(value) {
        if (typeof value === 'boolean') {
            this.__isInitialized = value
        }
    }

    get isInitialized() {
        return this.__isInitialized
    }
}
