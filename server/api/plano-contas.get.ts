import { eventHandler, getQuery } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 100
    const offset = parseInt(query.offset as string) || 0
    const ativo = query.ativo === 'false' ? false : query.ativo === 'true' ? true : null

    let base = admin.from('plano_contas').select('*', { count: 'exact' })
    if (ativo !== null) base = base.eq('ativo', ativo)
    if (query.codigo) base = base.eq('codigo', query.codigo as string)

    const { data, error, count } = await base.order('codigo', { ascending: true }).range(offset, offset + limit - 1)
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data, count: count ?? null }
  } catch (err: any) {
    console.error('[server/api/plano-contas.get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
