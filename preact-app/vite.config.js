import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
        output: {
            entryFileNames: 'bundle.js',
            assetFileNames: 'assets/[name].[ext]'
        }
    }
  }
})
