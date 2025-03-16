import { registerIconLibrary } from '../utils/icon'

/**
 * A collection of static SVG icons used as default icons in the library.
 */
const icons: Record<string, string> = {
    'chevron-down': `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 9l6 6l6 -6" /></svg>
    `,
    'chevron-up': `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 15l6 -6l6 6" /></svg>
    `,
}

/**
 * Registers a built-in icon library called 'wui-system' that serves static icons.
 */
 registerIconLibrary('wui-system', {
     resolver: (name) => {
         if (icons[name]) {
             return `data:image/svg+xml,${encodeURIComponent(icons[name])}`
         }
         return ''
     },
 })
