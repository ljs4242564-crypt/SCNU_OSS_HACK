import { Hono } from 'hono'
import type { HealthResponse } from '../shared/api'

export const healthRoute = new Hono()

healthRoute.get('/health', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'SCNU Campus Assistant API',
    version: '0.4.0',
    timestamp: new Date().toISOString(),
  }

  return c.json(response)
})
