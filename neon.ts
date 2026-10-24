import { defineConfig } from '@neon/config/v1'

const apiKey = process.env.AI_API_KEY
const baseUrl = process.env.AI_BASE_URL
const model = process.env.AI_MODEL
if (!apiKey || !baseUrl || !model) {
  throw new Error('AI_API_KEY, AI_BASE_URL, and AI_MODEL must be present in the deploy env file.')
}

export default defineConfig({
  functions: {
    api: {
      name: 'Web Wrench API',
      source: 'server/fetch.ts',
      externalPackages: ['pg'],
      env: {
        AI_API_KEY: apiKey,
        AI_BASE_URL: baseUrl,
        AI_MODEL: model,
        MONITOR_STORE: 'postgres',
      },
    },
  },
  triggers: {
    monitor: {
      type: 'schedule',
      function: 'api',
      cron: '* * * * *',
      functionPath: '/cron',
    },
  },
})
