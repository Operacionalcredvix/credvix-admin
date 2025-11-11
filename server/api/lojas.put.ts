import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // autentica token do header
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente' }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado' }

    // busca funcionario e perfil
    const { data: func, error: funcErr } = await admin.from('funcionarios').select('id,perfil_id').eq('user_id', userData.user.id).single()
    if (funcErr || !func) {
      try { await admin.from('auditoria').insert({ autor_id: null, acao: 'UPDATE_DENIED', entidade: 'lojas', descricao: 'Funcionário não encontrado', created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Funcionário não encontrado' }
    }
    let perfil = null
    if (func.perfil_id) {
      const { data: p } = await admin.from('perfis').select('nome').eq('id', func.perfil_id).single()
      perfil = p?.nome || null
    }
    if (!perfil || !['Master','RH'].includes(perfil)) {
      try { await admin.from('auditoria').insert({ autor_id: func.id || null, acao: 'UPDATE_DENIED', entidade: 'lojas', descricao: `Acesso negado (perfil=${perfil})`, created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Acesso negado' }
    }

    const body = await readBody(event)
    const id = body?.id
    if (!id) {
      try { await admin.from('auditoria').insert({ autor_id: func.id || null, acao: 'UPDATE_DENIED', entidade: 'lojas', descricao: 'Missing id', created_at: new Date().toISOString() }) } catch(e){}
      return { success: false, error: 'Missing id' }
    }

    const allowed = ['nome','franquia','regional_id','city','state','phone','whatsapp','address','instagram_url','is_active']
    const payload: any = {}
    for (const k of allowed) if (body[k] !== undefined) payload[k] = body[k]

    // pega estado atual (before) para auditoria
    let before = null
    try {
      const { data: b } = await admin.from('lojas').select('*').eq('id', id).single()
      before = b || null
    } catch(e) { before = null }

    const { data, error } = await admin.from('lojas').update(payload).eq('id', id).select().limit(1).single()
    if (error) {
      try { await admin.from('auditoria').insert({ autor_id: func.id || null, acao: 'UPDATE_FAILED', entidade: 'lojas', descricao: String(error?.message || error), created_at: new Date().toISOString() }) } catch(e){}
      console.error('Error updating loja:', error)
      return { success: false, error: error.message || String(error) }
    }

    // grava auditoria (não falha a resposta se audit falhar)
    try {
      const audPayload = {
        autor_id: func.id,
        acao: 'UPDATE',
        entidade: 'lojas',
        descricao: JSON.stringify({ id, before, after: data, payload }),
        created_at: new Date().toISOString()
      }
      await admin.from('auditoria').insert(audPayload)
    } catch (audErr) {
      console.warn('Falha ao gravar auditoria (lojas.put):', audErr)
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('lojas.put error', err)
    return { success: false, error: err.message || String(err) }
  }
})
