import { eventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    const query = getQuery(event)
  const loja_id = query.loja_id || null
  const status = query.status || null
  const vencidos = query.vencidos === 'true' || query.vencidos === '1' || false
    const limit = parseInt(query.limit as string) || 100
    const offset = parseInt(query.offset as string) || 0

    // Autenticação e autorização por perfil
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

  // constrói query com contagem (count exact) e inclui objetos relacionados (lojas, centros_custo)
  // trazemos nomes de loja/centro para evitar depender de consultas client-side e problemas de RLS
  // incluímos fornecedores e plano_contas nos selects para que o frontend possa mostrar nomes sem depender de consultas RLS
  let base = admin.from('contas_pagar').select('id,loja_id,descricao,data_vencimento,valor,status,pago,data_pagamento,pago_por,nota,criado_em,centro_custo_id,fornecedor_id,plano_conta_id,lojas(id,nome),centros_custo(id,nome),fornecedores(id,nome_razao),plano_contas(id,codigo,nome)', { count: 'exact' })
    if (loja_id) base = base.eq('loja_id', loja_id as string)
    if (query.centro_custo_id) base = base.eq('centro_custo_id', query.centro_custo_id as string)
    if (status) base = base.eq('status', status as string)
    if (vencidos) {
      // filtro de vencidos: data_vencimento < hoje e não pago
      const hoje = new Date().toISOString().split('T')[0]
      base = base.lt('data_vencimento', hoje).eq('pago', false)
    } else {
      if (query.date_from) base = base.gte('data_vencimento', query.date_from as string)
      if (query.date_to) base = base.lte('data_vencimento', query.date_to as string)
    }

  const { data, error, count } = await base.order('data_vencimento', { ascending: true }).range(offset, offset + limit - 1)
  if (error) return { success: false, error: error.message || String(error) }

  // If some rows reference fornecedor_id but the relation object wasn't included
  // (defensive: ensure we still resolve names by fetching fornecedores in batch)
  const raw = data || []
  try {
    const missingFornecedorIds = Array.from(new Set(raw.filter((r: any) => r.fornecedor_id && !(r.fornecedores || r.fornecedor)).map((r: any) => r.fornecedor_id)))
    if (missingFornecedorIds.length) {
      const { data: fetchedFornecedores, error: fErr } = await admin.from('fornecedores').select('id,nome_razao,nome').in('id', missingFornecedorIds)
      if (!fErr && Array.isArray(fetchedFornecedores)) {
        const byId: Record<string, any> = {}
        for (const f of fetchedFornecedores) byId[String(f.id)] = f
        // attach found fornecedor objects back to rows to simplify normalization below
        for (const r of raw) {
          if (r.fornecedor_id && !r.fornecedores && byId[String(r.fornecedor_id)]) {
            r.fornecedores = byId[String(r.fornecedor_id)]
          }
        }
        console.debug('[server/api/financeiro/contas-pagar.get] fetched fornecedores for missing ids:', missingFornecedorIds.length)
      }
    }
  } catch (e) {
    console.error('[server/api/financeiro/contas-pagar.get] fornecedores fetch error:', e)
  }

  // Debug: log incoming query for troubleshooting filters
  console.debug('[server/api/financeiro/contas-pagar.get] query:', query)

  // Normalize and add explicit display fields so frontend doesn't need to guess shapes
  const normalized = (raw || []).map((r: any) => {
    // helper to safely extract nested objects that may be present
    const lojaObj = r.lojas || r.loja || null
    const centroObj = r.centros_custo || r.centro || null
    const fornecedorObj = r.fornecedores || r.fornecedor || null

    const loja_nome = (lojaObj && (lojaObj.nome || lojaObj.name || lojaObj.fantasia)) || r.loja_nome || r.lojaName || null
    const centro_nome = (centroObj && (centroObj.nome || centroObj.name)) || r.centro_nome || r.centroName || null
    const fornecedor_nome = (fornecedorObj && (fornecedorObj.nome_razao || fornecedorObj.nome || fornecedorObj.name)) || r.fornecedor_nome || r.fornecedorName || null

    // ensure numeric valor and consistent criado_em
    const valor_num = r.valor !== undefined && r.valor !== null ? Number(r.valor) : null
    const criado_em = r.criado_em ?? r.created_at ?? r.lancamento ?? r.criadoEm ?? null

    return {
      ...r,
      loja_nome,
      centro_nome,
      fornecedor_nome,
      valor: valor_num,
      criado_em
    }
  })

  // Debug: show a small sample of normalized rows to help frontend mapping
  console.debug('[server/api/financeiro/contas-pagar.get] normalized sample:', (normalized || []).slice(0,3))

  return { success: true, data: normalized, count: count ?? null }
  } catch (err: any) {
    console.error('[server/api/financeiro/contas-pagar.get] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
