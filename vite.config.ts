import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],

  // ──────────────────────────────────────────────────────
  // Prefijo bajo el cual vive la app en IIS (gacenssv03/conductas-proyectos)
  // En dev usamos '/' para URL limpia; en build usamos '/conductas-proyectos/'
  // ──────────────────────────────────────────────────────
  base: command === 'build' ? '/conductas-proyectos/' : '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ──────────────────────────────────────────────────────
  // Build: que caiga directo dentro de backend/ para que FastAPI lo sirva
  // ──────────────────────────────────────────────────────
  build: {
    outDir: 'backend/dist',
    emptyOutDir: true,
  },

  // ──────────────────────────────────────────────────────
  // Servidor de desarrollo — proxy + accesible desde red local
  // ──────────────────────────────────────────────────────
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/conductas-proyectos/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
}))