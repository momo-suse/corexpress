import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // index.html lands at packages/app/public/index.html (served by Apache)
    outDir: '../app/public',
    // CRITICAL: do not wipe .htaccess, index.php, setup/ dir on each build
    emptyOutDir: false,
    // JS/CSS go to packages/app/public/assets/
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query:  ['@tanstack/react-query'],
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link',
                   '@tiptap/extension-image', '@tiptap/extension-text-align',
                   '@tiptap/extension-highlight', '@tiptap/extensions'],
          icons:  ['lucide-react'],
          i18n:   ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          state:  ['zustand'],
        },
      },
    },
  },
})
