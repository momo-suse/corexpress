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
          query: ['@tanstack/react-query'],
          editor: ['@tiptap/react', '@tiptap/starter-kit'],
        },
      },
    },
  },
})
