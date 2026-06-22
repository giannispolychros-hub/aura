import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        // Dev-only proxy: routes /api/aura to Anthropic with the server-side key
        // In production (Vercel), the /api/aura.js serverless function handles this
        '/api/aura': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/aura/, '/v1/messages'),
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': env.ANTHROPIC_API_KEY || ''
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
