import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O front chama '/api/...' e o Vite repassa para o backend Spring em :8080.
// Assim o dev roda same-origin (nada de CORS no navegador) e espelha producao,
// onde front e API sao servidos do mesmo host.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
