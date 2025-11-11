import { readBody, eventHandler } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await readBody(event)
    const { codigo, nome, descricao = null, tipo = 'despesa', ativo = true } = body || {}
    if (!codigo || !nome) return { success: false, error: 'codigo e nome são obrigatórios' }

    const payload = { codigo, nome, descricao, tipo, ativo }
    const { data, error } = await admin.from('plano_contas').insert(payload).select().limit(1).single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/plano-contas.post] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
