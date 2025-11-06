import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

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

    const body = await readBody(event)
    const id = event.context.params?.id
    if (!id) return { success: false, error: 'ID ausente' }

    const { nome, descricao, ativo } = body || {}
    const payload: any = {}
    if (typeof nome !== 'undefined') payload.nome = String(nome).trim()
    if (typeof descricao !== 'undefined') payload.descricao = descricao
    if (typeof ativo !== 'undefined') payload.ativo = !!ativo

    const { data, error } = await admin.from('centros_custo').update(payload).eq('id', Number(id)).select().single()
    if (error) return { success: false, error: error.message || String(error) }
    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/centros-custo/[id].put] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
