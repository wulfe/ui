import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: './src',
    plugins: [tailwindcss(),],
    resolve: {
        alias: {
            '@wulfe/ui-components/src': resolve(__dirname, '../packages/components/src'),
        },
    },
})
