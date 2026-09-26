import { Hono } from 'hono'
import type { HealthResponse } from '../shared/api'

const APP_VERSION = '1.1.0'
const RELEASE_ID = '2026-09-26-corrective-1'
const BUILT_AT = '2026-09-26T13:39:00.000Z'

export const healthRoute = new Hono()

healthRoute.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'SCNU Campus Assistant API',
    appVersion: APP_VERSION,
    releaseId: RELEASE_ID,
    builtAt: BUILT_AT,
    timestamp: new Date().toISOString(),
  }

  return c.json(response)
})
