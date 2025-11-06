import { eventHandler, getQuery } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const query = getQuery(event)
    const listarTodos = query.all === 'true' || false

    // se pedir todos, exige perfil administrativo
    if (listarTodos) {
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
    }

    let builder = admin.from('centros_custo').select('id,codigo,nome,descricao,ativo,criado_em')
    if (!listarTodos) builder = builder.eq('ativo', true)
    const { data, error } = await builder.order('nome', { ascending: true })
    if (error) return { success: false, error: error.message || String(error) }
    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/centros-custo.get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
