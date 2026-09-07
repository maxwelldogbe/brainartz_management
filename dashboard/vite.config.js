import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------

const PORT = 3031;
const API_URL = process.env.VITE_SERVER_URL || 'http://localhost:8000';

export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
    ],
  },
  server: {
    port: PORT,
    host: true,
    proxy: {
      '/api': { target: API_URL, changeOrigin: true },
      '/auth/jwt/create': { target: API_URL, changeOrigin: true },
      '/auth/jwt/refresh': { target: API_URL, changeOrigin: true },
      '/auth/jwt/verify': { target: API_URL, changeOrigin: true },
      '/auth/users': { target: API_URL, changeOrigin: true },
      '/media': { target: API_URL, changeOrigin: true },
    },
  },
  preview: { port: PORT, host: true },
});
