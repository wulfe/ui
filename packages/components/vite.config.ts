import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: {
                'index': resolve(__dirname, 'src/index.ts'),
                'accordion': resolve(__dirname, 'src/accordion/index.ts'),
                'accordion-item': resolve(__dirname, 'src/accordion-item/index.ts'),
                'dialog': resolve(__dirname, 'src/dialog/index.ts'),
                'icon': resolve(__dirname, 'src/icon/index.ts'),
                'tab': resolve(__dirname, 'src/tab/index.ts'),
                'tab-group': resolve(__dirname, 'src/tab-group/index.ts'),
                'tab-panel': resolve(__dirname, 'src/tab-panel/index.ts'),
                'utils/icon': resolve(__dirname, 'src/utils/icon.ts'),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                /^lit\/?.*/,
                'tabbable',
            ],
        },
    },
})
