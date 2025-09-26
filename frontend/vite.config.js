import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/', // despliegue en raíz
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // import '@/algo'
    },
  },
  build: {
    sourcemap: false, // prod limpio
  },
  server: {
    // 👇 permite abrir el dev-server desde ngrok
    allowedHosts: ['.ngrok-free.dev'],
    port: 5173,
    // 👇 redirige /api/* al backend local en dev
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
