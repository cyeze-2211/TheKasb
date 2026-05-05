import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const DEFAULT_API_TARGET = 'http://localhost:7080'


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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_BASE_URL || DEFAULT_API_TARGET

  /** Node proxy → ngrok: brauzer HTML ogohlantirish sahifasini olmasin */
  const ngrokProxyConfigure = (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      if (String(apiProxyTarget).includes('ngrok')) {
        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
      }
    })
  }

  return {
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
          if (id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('@radix-ui')) return 'radix'
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      // Dev: brauzer faqat shu originga so‘raydi — CORS muammosi bo‘lmaydi
      // Backend'ning ikki xil prefixi bor:
      // - /api/admin/*  (prefiks SAQLANADI)
      // - /sdg/*        (prefiks /api olib tashlanadi: /api/sdg/* -> /sdg/*)
      '/api/admin': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: ngrokProxyConfigure,
        // rewrite yo'q: /api/admin/* backendga xuddi shunday boradi
      },
      '/api/professions': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: ngrokProxyConfigure,
        // /api/professions/* prefiksi saqlanadi (Swagger: /api/professions/categories)
      },
      /**
       * /api/sdg/uz ro‘yxat va CRUD — backend `/api/sdg/uz` (404 oldini olish).
       * Fayl va login: `/sdg/uz/...` (prefiks /api olib tashlanadi).
       */
      '/api/sdg': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: ngrokProxyConfigure,
        rewrite: (path) => {
          const pathname = path.split('?')[0] ?? path
          if (
            pathname.startsWith('/api/sdg/uz/get') ||
            pathname.startsWith('/api/sdg/uz/upload') ||
            pathname.startsWith('/api/sdg/uz/delete') ||
            pathname.startsWith('/api/sdg/uz/login')
          ) {
            return path.replace(/^\/api/, '')
          }
          return path
        },
      },
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: ngrokProxyConfigure,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      /** Backend `/api/auth/*` — serverda `/api` prefiksi bilan */
      '/kasb-backend': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
        configure: ngrokProxyConfigure,
        rewrite: (p) => p.replace(/^\/kasb-backend/, '/api'),
      },
    },
  },
}
})
