import { Hono } from 'hono'

const app = new Hono()

app.get('*', (c) => {
  const clientScript = import.meta.env.PROD
    ? '<script type="module" src="/static/client.js"></script>'
    : '<script type="module" src="/src/frontend/main.tsx"></script>'
  const clientStyle = import.meta.env.PROD
    ? '<link rel="stylesheet" href="/static/client.css">'
    : ''

  return c.html(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#102a57">
    <meta name="description" content="국립순천대학교 공식 정보를 출처와 함께 안내하는 캠퍼스 생활 도우미">
    <title>SCNU Campus Assistant</title>
    ${clientStyle}
  </head>
  <body>
    <div id="root"></div>
    ${clientScript}
  </body>
</html>`)
})

export default app
