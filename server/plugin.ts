import { loadEnv, type Connect, type Plugin } from 'vite'
import { createApiMiddleware } from './api.ts'
import { startScheduler } from './jobs.ts'

export function apiPlugin(): Plugin {
  const attach = (mode: string, middlewares: Connect.Server) => {
    const env = { ...loadEnv(mode, process.cwd(), ''), ...pickedProcessEnv() }
    middlewares.use(createApiMiddleware(env))
    startScheduler()
  }
  return {
    name: 'webwrench-api',
    configureServer(server) {
      attach(server.config.mode, server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.config.mode, server.middlewares)
    },
  }
}

function pickedProcessEnv() {
  const picked: Record<string, string> = {}
  for (const key of ['GROQ_API_KEY', 'AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL']) {
    const value = process.env[key]?.trim()
    if (value) picked[key] = value
  }
  return picked
}
