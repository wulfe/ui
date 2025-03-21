import { WUI } from '../core/consts'

/**
 * Based on Datastar's dom utilities
 * Source: https://github.com/starfederation/datastar/blob/main/library/src/utils/dom.ts
 * License: MIT
*/

export class Hash {
    #value = 0
    #prefix: string

    constructor(prefix = WUI) {
        this.#prefix = prefix
    }

    with(x: number | string | boolean): Hash {
        if (typeof x === 'string') {
            for (const c of x.split('')) {
                this.with(c.charCodeAt(0))
            }
        } else if (typeof x === 'boolean') {
            this.with(1 << (x ? 7 : 3))
        } else {
            // use djb2 favored by bernstein http://www.cse.yorku.ca/~oz/hash.html
            this.#value = (this.#value * 33) ^ x
        }
        return this
    }

    get value() {
        return this.#value
    }

    get string() {
        return this.#prefix + Math.abs(this.#value).toString(36)
    }
}

export function elUniqId(el: Element) {
    if (el.id) return el.id
    const hash = new Hash()

    let currentEl = el
    while (currentEl) {
        hash.with(currentEl.tagName || '')
        if (currentEl.id) {
            hash.with(currentEl.id)
            break
        }
        const p = currentEl?.parentNode
        if (p) hash.with([...p.children].indexOf(currentEl))

        currentEl = p as Element
    }
    return hash.string
}


export function attrHash(key: number | string, val: number | string) {
    return new Hash().with(key).with(val).value
}

/**
 * Get the active element, accounting for Shadow DOM subtrees.
 * @author Cory LaViska
 * @see: https://www.abeautifulsite.net/posts/finding-the-active-element-in-a-shadow-root/
 */
export function getActiveEl(
    root: Document | ShadowRoot = document
): Element | null {
    const activeEl = root.activeElement

    if (! activeEl) return null

    // If there’s a shadow root, recursively find the active element within it.
    // If the recursive call returns null, return the active element of the top-level Document.
    if (activeEl.shadowRoot)
        return getActiveEl(activeEl.shadowRoot) || document.activeElement

    // If not, we can just return the active element.
    return activeEl
}
