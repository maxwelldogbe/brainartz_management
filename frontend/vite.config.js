import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // Production base path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  server: {
    port: 5173, // Force use of port 5173
    proxy: {
      '/auth': {
        target: 'http://localhost:8000', // Updated to match Django server
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8000', // Updated to match Django server
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000', // WebSocket proxy
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})