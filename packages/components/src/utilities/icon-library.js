const iconLibraries = new Map()

export const registerIconLibrary = (name, config) => {
    iconLibraries.set(name, {
        resolver: config.resolver,
        mutator: config.mutator,
        default: config.default || false,
    })
}

export const getIconLibrary = (name) => {
    if (! name) return
    return iconLibraries.get(name)
}

export const getDefaultIconLibrary = () => {
    let result = null

    for (const [key] of iconLibraries) {
        if (iconLibraries.get(key).default) {
            result = key
            break
        }
    }

    return result
}
