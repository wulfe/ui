import { IconLibraryConfig } from '../core/types'

// A map to store registered icon libraries, keyed by their name.
const iconLibraries = new Map<string, IconLibraryConfig>()

/**
 * Registers a new icon library.
 *
 * @param name - The unique name of the icon library.
 * @param config - The configuration for the library, including:
 *   - resolver: A function that generates the icon's URL based on its name and variant.
 *   - mutator (optional): A function that modifies the fetched SVG before rendering.
 *   - default (optional): Whether this library should be the default.
 */
export const registerIconLibrary = (name: string, config: IconLibraryConfig): void => {
    iconLibraries.set(name, {
        resolver: config.resolver,
        mutator: config.mutator,
        default: config.default ?? false,
    })
}

/**
 * Retrieves a registered icon library by name.
 *
 * @param name - The name of the icon library.
 * @returns The configuration of the library if found, otherwise `undefined`.
 */
export const getIconLibrary = (name?: string): IconLibraryConfig | undefined => {
    return name ? iconLibraries.get(name) : undefined
}

/**
 * Retrieves the name of the default icon library.
 *
 * @returns The name of the default icon library if one is set, otherwise `undefined`.
 */
export const getDefaultIconLibrary = (): string | undefined => {
    for (const [key, config] of iconLibraries) {
        if (config.default) {
            return key
        }
    }
}
