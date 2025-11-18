import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const body = await readBody(event) || {}
    const periodo = body.periodo || null
    if (!periodo) return { success: false, error: 'Parâmetro periodo ausente (ex: 2025-11-01)', data: null }

    const { data, error } = await admin.from('metas').select('*').eq('periodo', periodo).order('loja_id')
    if (error) {
      console.error('[server/api/metas/debug] error:', error)
      return { success: false, error: error.message || 'Erro na query', data: null }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[server/api/metas/debug] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
