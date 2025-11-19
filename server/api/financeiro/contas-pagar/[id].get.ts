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

    const { data, error } = await admin.from('contas_pagar')
      .select('*,lojas(id,nome),centros_custo(id,nome),fornecedores(id,nome_razao),plano_contas(id,codigo,nome)')
      .eq('id', id)
      .single()

    if (error) return { success: false, error: error.message || String(error) }

    const r = data || null
    if (!r) return { success: false, error: 'Lançamento não encontrado' }

    const lojaObj = r.lojas || r.loja || null
    const centroObj = r.centros_custo || r.centro || null
    const fornecedorObj = r.fornecedores || r.fornecedor || null

    const loja_nome = (lojaObj && (lojaObj.nome || lojaObj.name || lojaObj.fantasia)) || r.loja_nome || r.lojaName || null
    const centro_nome = (centroObj && (centroObj.nome || centroObj.name)) || r.centro_nome || r.centroName || null
    const fornecedor_nome = (fornecedorObj && (fornecedorObj.nome_razao || fornecedorObj.nome || fornecedorObj.name)) || r.fornecedor_nome || r.fornecedorName || null

    const valor_num = r.valor !== undefined && r.valor !== null ? Number(r.valor) : null
    const criado_em = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? null

    const normalized = {
      ...r,
      loja_nome,
      centro_nome,
      fornecedor_nome,
      valor: valor_num,
      criado_em
    }

    return { success: true, data: normalized }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar/[id].get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
