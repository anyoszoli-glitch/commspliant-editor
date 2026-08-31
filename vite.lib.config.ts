import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: 'dist-package',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(dirname, 'src/CommsPliantEditor.ts'),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@puckeditor/core',
        '@tiptap/core',
        'dompurify',
      ],
    },
  },
})
