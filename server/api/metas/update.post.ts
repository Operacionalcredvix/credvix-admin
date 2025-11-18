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
    const id = body.id
    if (!id) return { success: false, error: 'ID da meta ausente', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

    const { id: _id, ...updateData } = body
    const { data, error } = await admin.from('metas').update(updateData).eq('id', id)
    if (error) {
      console.error('[server/api/metas/update] error:', error)
      return { success: false, error: error.message || 'Erro ao atualizar meta', data: null }
    }

    return { success: true, data: data || null }
  } catch (err: any) {
    console.error('[server/api/metas/update] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
