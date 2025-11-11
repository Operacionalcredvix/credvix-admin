import { eventHandler } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente' }

    // soft-delete: definir ativo = false
    const { data, error } = await admin.from('plano_contas').update({ ativo: false }).eq('id', id).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/plano-contas/[id].delete] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
