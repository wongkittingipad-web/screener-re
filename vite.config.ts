import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    viteSingleFile() // Bundles JS/CSS directly into index.html
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})