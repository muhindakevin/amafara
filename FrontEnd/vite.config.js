import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    fs: {
      strict: false
    }
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.version': '"v16.0.0"',
    'process.browser': 'true',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['simple-peer', 'stream-browserify', 'buffer', 'util'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'simple-peer': ['simple-peer'],
        },
      },
    },
  },
})


