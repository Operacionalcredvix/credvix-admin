import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente' }

    // soft-delete: definir ativo = false
    const { data, error } = await admin.from('fornecedores').update({ ativo: false }).eq('id', id).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/fornecedores/[id].delete] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
