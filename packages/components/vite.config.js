import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                'index': resolve(__dirname, 'src/index.js'),
                'accordion': resolve(__dirname, 'src/accordion/index.js'),
                'accordion-item': resolve(__dirname, 'src/accordion-item/index.js'),
                'icon': resolve(__dirname, 'src/icon/index.js'),
                'utilities/base-path': resolve(__dirname, 'src/utilities/base-path.js'),
                'utilities/icon-library': resolve(__dirname, 'src/utilities/icon-library.js'),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: [/^lit\/?.*/],
        },
    },
})
