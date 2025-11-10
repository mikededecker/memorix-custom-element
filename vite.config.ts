import {defineConfig} from 'vite'
import vuePlugin from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vuePlugin()
    ],
    resolve: {
        alias: {
            "@": "/src"
        }
    },
    build: {
        lib: {
            entry: 'src/main.ts',
            name: 'memorix-search-all',
            fileName: (format, entryName) => `memorix-search-all.${format}.js`,
            formats: ['es', 'umd']
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
})
