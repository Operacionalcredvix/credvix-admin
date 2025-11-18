import { eventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // autentica token do header
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) {
      // grava tentativa negada
      try { await admin.from('auditoria').insert({ autor_id: null, acao: 'CREATE_DENIED', entidade: 'lojas', descricao: 'Token ausente', created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Token ausente' }
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) {
      try { await admin.from('auditoria').insert({ autor_id: null, acao: 'CREATE_DENIED', entidade: 'lojas', descricao: 'Usuário não autenticado', created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Usuário não autenticado' }
    }

    // busca funcionario e perfil
    const { data: func, error: funcErr } = await admin.from('funcionarios').select('id,perfil_id').eq('user_id', userData.user.id).single()
    if (funcErr || !func) {
      try { await admin.from('auditoria').insert({ autor_id: null, acao: 'CREATE_DENIED', entidade: 'lojas', descricao: 'Funcionário não encontrado', created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Funcionário não encontrado' }
    }
    let perfil = null
    if (func.perfil_id) {
      const { data: p } = await admin.from('perfis').select('nome').eq('id', func.perfil_id).single()
      perfil = p?.nome || null
    }
    if (!perfil || !['Master','RH'].includes(perfil)) {
      try { await admin.from('auditoria').insert({ autor_id: func.id || null, acao: 'CREATE_DENIED', entidade: 'lojas', descricao: `Acesso negado (perfil=${perfil})`, created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Acesso negado' }
    }

    const body = await readBody(event)

    // Sanitize input: only allow known columns
    const allowed = ['nome','franquia','regional_id','city','state','phone','whatsapp','address','instagram_url','is_active']
    const payload: any = {}
    for (const k of allowed) if (body[k] !== undefined) payload[k] = body[k]

    const { data, error } = await admin.from('lojas').insert(payload).select().limit(1).single()
    if (error) {
      // grava tentativa falhada
      try { await admin.from('auditoria').insert({ autor_id: func.id || null, acao: 'CREATE_FAILED', entidade: 'lojas', descricao: String(error?.message || error), created_at: new Date().toISOString() }) } catch(e){}
      console.error('Error inserting loja:', error)
      return { success: false, error: error.message || String(error) }
    }

    // tente gravar auditoria (não bloqueia a resposta ao cliente)
    try {
      const audPayload = {
        autor_id: func.id,
        acao: 'CREATE',
        entidade: 'lojas',
        descricao: JSON.stringify({ id: data?.id, nome: data?.nome, payload }),
        created_at: new Date().toISOString()
      }
      await admin.from('auditoria').insert(audPayload)
    } catch (audErr) {
      console.warn('Falha ao gravar auditoria (lojas.post):', audErr)
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('lojas.post error', err)
    return { success: false, error: err.message || String(err) }
  }
})
