import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Configuração do Supabase ausente no servidor', data: null }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

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
