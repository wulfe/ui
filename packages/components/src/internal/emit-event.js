const EVENT_PREFIX = 'wui-';

const EVENT_OPTIONS = {
    bubbles: true,
    composed: true,
    cancelable: false,
}

export function emitEvent(element, name, detail = null, overrideOptions = {}) {
    const eventOptions = {
        ...EVENT_OPTIONS,
        ...overrideOptions,
    }

    const event = new CustomEvent(`${EVENT_PREFIX}${name}`, {
        detail,
        ...eventOptions,
    })

    element.dispatchEvent(event)
    return ! event.defaultPrevented
}
