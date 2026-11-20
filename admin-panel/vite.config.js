import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The panel is served from https://onyx.devenginehq.com/admin/...
// Build output goes straight into D:\onyx-policy\admin so GitHub Pages serves it.
export default defineConfig({
  base: '/admin/',
  envDir: '..', // read D:\onyx-policy\.env
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../admin',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
})
