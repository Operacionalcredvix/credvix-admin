import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente', data: null }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const body = await readBody(event) || {}
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return { success: false, error: 'Nenhuma linha para importar', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Backoffice']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

    // try to upsert into table 'dia_a_dia_lojas' - expects client to send normalized columns matching table
    try {
      const { data: upserted, error: upsertErr } = await admin.from('dia_a_dia_lojas').upsert(rows).select('*')
      if (upsertErr) {
        console.error('[server/api/importacoes/dia-a-dia-lojas/import] upsert error:', upsertErr)
        return { success: false, error: upsertErr.message || 'Erro ao importar Dia a Dia', data: { upsertErr } }
      }
      return { success: true, data: { insertedOrUpdated: upserted || [] } }
    } catch (e: any) {
      console.error('[server/api/importacoes/dia-a-dia-lojas/import] exception during upsert:', e)
      return { success: false, error: e?.message || 'Erro ao importar', data: null }
    }
  } catch (err: any) {
    console.error('[server/api/importacoes/dia-a-dia-lojas/import] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
