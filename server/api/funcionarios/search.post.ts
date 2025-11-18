import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // valida token do chamador
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente', data: null }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado', data: null }

    const body = await readBody(event) || {}
    const q = (body.q || body.search || '').trim();
    const perfilNames = Array.isArray(body.perfil_names) ? body.perfil_names : (body.perfil_names ? [body.perfil_names] : []);
    const isActive = body.is_active === undefined ? null : !!body.is_active;
    const limit = body.limit || 50

    // verifica perfil do chamador: apenas perfis administrativos podem listar sem q
    const { data: callerProfileRow, error: callerProfileErr } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single();
    if (callerProfileErr) {
      console.error('[server/api/funcionarios/search] erro ao buscar perfil do chamador:', callerProfileErr);
    }
    const callerPerfilId = callerProfileRow?.perfil_id || null
    const { data: callerPerfil, error: callerPerfilErr } = await admin.from('perfis').select('id, nome').eq('id', callerPerfilId).single();
    if (callerPerfilErr) {
      console.error('[server/api/funcionarios/search] erro ao buscar perfis table:', callerPerfilErr);
    }
    const callerNome = callerPerfil?.nome || null
    const allowedAdmin = ['Master','Diretoria','Gerência','RH']
    const isAdminLike = allowedAdmin.includes(callerNome)

    // se não for admin-like e não houver termo de busca, devolve vazio
    if (!isAdminLike && !q) return { success: true, data: [] }

    // constrói consulta (select simplificado para evitar parsing/joins complexos no search)
    let query = admin.from('funcionarios').select('id,nome_completo,cpf,email,is_active,ultimo_login,ultimo_ip,perfil_id,loja_id')
    if (q && q.length >= 1) {
      // busca por nome ou cpf (ilike)
      const escaped = q.replace(/[%_]/g, '\\$&')
      query = query.or(`nome_completo.ilike.%${escaped}%,cpf.ilike.%${escaped}%`)
    }

    if (perfilNames.length > 0) {
      // traduz nomes de perfis para ids
      const { data: perfisRows, error: perfisErr } = await admin.from('perfis').select('id').in('nome', perfilNames)
      if (perfisErr) console.error('[server/api/funcionarios/search] erro ao buscar perfis por nome:', perfisErr)
      const ids = (perfisRows || []).map(p => p.id).filter(Boolean)
      if (ids.length > 0) query = query.in('perfil_id', ids)
    }

    if (isActive !== null) query = query.eq('is_active', isActive)

    query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      console.error('[server/api/funcionarios/search] error:', error)
      return { success: false, error: error.message || 'Erro na busca', data: null }
    }

    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('[server/api/funcionarios/search] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
