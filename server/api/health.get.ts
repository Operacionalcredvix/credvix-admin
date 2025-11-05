import { eventHandler } from 'h3'

export default eventHandler(() => {
  return { ok: true, time: new Date().toISOString() }
})
