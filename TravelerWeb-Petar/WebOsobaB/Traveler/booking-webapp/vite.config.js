import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // tailwind plugin da radi utility klase direktno u jsx
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
