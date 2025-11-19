import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente na rota' }

    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente' }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado' }

    const { data: func, error: funcErr } = await admin.from('funcionarios').select('id,perfil_id').eq('user_id', userData.user.id).single()
    if (funcErr || !func) return { success: false, error: 'Funcionário não encontrado' }
    let perfil = null
    if (func.perfil_id) {
      const { data: p } = await admin.from('perfis').select('nome').eq('id', func.perfil_id).single()
      perfil = p?.nome || null
    }
    if (!perfil || !['Master','Diretoria','Financeiro'].includes(perfil)) return { success: false, error: 'Acesso negado' }

    const { error } = await admin.from('contas_pagar').delete().eq('id', id)
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar/[id].delete] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
