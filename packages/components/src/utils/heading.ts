import { MIN_HEADING_LEVEL, MAX_HEADING_LEVEL } from '../core/consts'
import { HeadingLevel } from '../core/types'
import { inRange } from './number'

/**
 * Validates and returns a valid heading level.
 * @param level - The requested heading level.
 * @param defaultLevel - The default heading level if invalid.
 */
export function validateHeadingLevel(level: number, defaultLevel: HeadingLevel): HeadingLevel {
    if (! Number.isInteger(level) || ! inRange(level, MIN_HEADING_LEVEL, MAX_HEADING_LEVEL)) {
        console.warn(`Invalid heading level: ${level}. Must be between ${MIN_HEADING_LEVEL}-${MAX_HEADING_LEVEL}. Defaulting to ${defaultLevel}.`)
        return defaultLevel
    }

    return level as HeadingLevel
}

/**
 * Returns a valid HTML heading tag (h1-h6) based on the given heading level.
 * @param level - The validated heading level.
 */
export function getHeadingTag(level: HeadingLevel): string {
    return `h${level}`
}
