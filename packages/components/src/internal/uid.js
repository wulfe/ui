import { nanoid } from 'nanoid'

const uid = (namespace, length) => {
    const uid = nanoid(length)

    if (namespace) {
        return `${namespace}:${uid}`
    }

    return uid
}

export { uid }
