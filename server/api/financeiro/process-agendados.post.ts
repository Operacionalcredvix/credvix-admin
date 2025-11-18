import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export const schedule = '0 0 * * *' // execução diária à meia-noite (UTC)

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // Permite execução manual (via POST) ou automática pela schedule.
    // Encontrar títulos agendados cuja data agendada já chegou e movê-los para pendente.
    const now = new Date().toISOString()
    const { data: rows, error: selErr } = await admin.from('contas_pagar').select('id,agendado_para,status').lte('agendado_para', now).eq('status', 'agendado')
    if (selErr) return { success: false, error: selErr.message || String(selErr) }

    let count = 0
    if (Array.isArray(rows) && rows.length) {
      // atualizar em lote: definimos status pendente e limpamos agendado_para opcionalmente
      const ids = rows.map(r => r.id)
      const { error: updErr } = await admin.from('contas_pagar').update({ status: 'pendente' }).in('id', ids)
      if (updErr) return { success: false, error: updErr.message || String(updErr) }
      count = ids.length
    }

    return { success: true, processed: count }
  } catch (err: any) {
    console.error('[server/api/financeiro/process-agendados] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
