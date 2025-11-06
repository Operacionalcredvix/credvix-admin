import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
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
    if (funcErr || !func) return { success: false, error: 'Funcionário não encontrado' }
    let perfil = null
    if (func.perfil_id) {
      const { data: p } = await admin.from('perfis').select('nome').eq('id', func.perfil_id).single()
      perfil = p?.nome || null
    }
    if (!perfil || !['Master','Diretoria','Financeiro'].includes(perfil)) return { success: false, error: 'Acesso negado' }

    const body = await readBody(event)
    const { codigo, nome, descricao } = body || {}
    if (!nome) return { success: false, error: 'Nome é obrigatório' }

    // se codigo não foi enviado, geramos a partir do nome (slug) e garantimos unicidade
    const slugify = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
    let finalCodigo = codigo ? String(codigo).trim() : slugify(nome)
    // checa duplicidade e, se existir, acrescenta timestamp curto
    const { data: exist } = await admin.from('centros_custo').select('id').eq('codigo', finalCodigo).single()
    if (exist) {
      finalCodigo = `${finalCodigo}-${Date.now().toString().slice(-4)}`
    }

    const payload: any = { codigo: finalCodigo, nome: String(nome).trim(), descricao: descricao || null, ativo: true, criado_em: new Date().toISOString() }

    const { data, error } = await admin.from('centros_custo').insert(payload).select().single()
    if (error) return { success: false, error: error.message || String(error) }

    return { success: true, data }
  } catch (err: any) {
    console.error('[server/api/centros-custo.post] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
