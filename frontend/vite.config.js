import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',                               // despliegue en raíz
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // import '@/algo'
    },
  },
  build: {
    sourcemap: false,                       // prod limpio
  },
})
