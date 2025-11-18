import { eventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 100
    const offset = parseInt(query.offset as string) || 0

    let base = admin.from('fornecedores').select('*', { count: 'exact' })
    if (query.nome) base = base.ilike('nome_razao', `%${query.nome}%`)

    const { data, error, count } = await base.order('nome_razao', { ascending: true }).range(offset, offset + limit - 1)
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data, count: count ?? null }
  } catch (err: any) {
    console.error('[server/api/fornecedores.get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
