import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                'index': resolve(__dirname, 'src/index.js'),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: [/^lit\/?.*/],
        },
    },
})
