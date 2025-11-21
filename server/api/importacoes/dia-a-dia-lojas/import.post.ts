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
    const rows = Array.isArray(body.rows) ? body.rows : []
    const periodo = body.periodo || null
    
    if (!rows.length) return { success: false, error: 'Nenhuma linha para importar', data: null }
    if (!periodo) return { success: false, error: 'Período ausente', data: null }

    // checa perfil do chamador
    const { data: perfilRow } = await admin.from('funcionarios').select('perfil_id').eq('user_id', userData.user.id).single()
    const perfilId = perfilRow?.perfil_id || null
    const { data: perfil } = await admin.from('perfis').select('id,nome').eq('id', perfilId).single()
    const nomePerfil = perfil?.nome || null
    const allowed = ['Master', 'Diretoria', 'Gerência', 'Backoffice']
    if (!allowed.includes(nomePerfil)) return { success: false, error: 'Permissão negada', data: null }

    // Load existing metas for the period
    const lojaIds = rows.map((r: any) => r.lojaId).filter(Boolean)
    const { data: existingMetas } = await admin.from('metas').select('*').in('loja_id', lojaIds).eq('periodo', periodo)
    const metasMap = new Map((existingMetas || []).map((m: any) => [m.loja_id, m]))

    const toUpsert: any[] = []
    const errors: any[] = []

    for (const [i, r] of rows.entries()) {
      const lojaId = r.lojaId
      if (!lojaId) {
        errors.push({ row: i + 1, reason: 'Loja ID ausente' })
        continue
      }

      const parsed = r.parsed || {}
      const existing = metasMap.get(lojaId)

      // ADDITIVE LOGIC: Sum imported "Vlr Liberado" values with existing values
      // For metas: use imported value if provided and different, otherwise keep existing
      const record: any = {
        loja_id: lojaId,
        periodo,
        // CNC
        atingido_cnc: (existing?.atingido_cnc || 0) + (parsed.cnc_liberado || 0),
        meta_cnc: parsed.meta_cnc > 0 ? parsed.meta_cnc : (existing?.meta_cnc || 0),
        // Card Benefício
        atingido_card_beneficio: (existing?.atingido_card_beneficio || 0) + (parsed.card_beneficio_liberado || 0),
        meta_card_beneficio: parsed.meta_card_beneficio > 0 ? parsed.meta_card_beneficio : (existing?.meta_card_beneficio || 0),
        // BMG Card
        atingido_card: (existing?.atingido_card || 0) + (parsed.bmg_card_liberado || 0),
        meta_card: parsed.meta_bmg_card > 0 ? parsed.meta_bmg_card : (existing?.meta_card || 0),
        // FGTS
        atingido_fgts: (existing?.atingido_fgts || 0) + (parsed.fgts_liberado || 0),
        meta_fgts: parsed.meta_fgts > 0 ? parsed.meta_fgts : (existing?.meta_fgts || 0),
        // Consignado (includes Consig. Privado)
        atingido_consignado: (existing?.atingido_consignado || 0) + (parsed.consignado_liberado || 0),
        meta_consignado: parsed.meta_consignado > 0 ? parsed.meta_consignado : (existing?.meta_consignado || 0)
      }

      // New products: CP pra todos, Antecipação
      // These need to be added to the metas table schema if not already present
      if (parsed.cp_pra_todos_liberado || parsed.meta_cp_pra_todos) {
        record.atingido_cp_pra_todos = (existing?.atingido_cp_pra_todos || 0) + (parsed.cp_pra_todos_liberado || 0)
        record.meta_cp_pra_todos = parsed.meta_cp_pra_todos > 0 ? parsed.meta_cp_pra_todos : (existing?.meta_cp_pra_todos || 0)
      }
      
      if (parsed.antecipacao_liberado || parsed.meta_antecipacao) {
        record.atingido_antecipacao = (existing?.atingido_antecipacao || 0) + (parsed.antecipacao_liberado || 0)
        record.meta_antecipacao = parsed.meta_antecipacao > 0 ? parsed.meta_antecipacao : (existing?.meta_antecipacao || 0)
      }

      // Preserve other existing fields that are not part of this import
      if (existing) {
        record.orçados = existing.orçados
        record.meta_bmg_med = existing.meta_bmg_med
        record.atingido_bmg_med = existing.atingido_bmg_med
        record.meta_seguro_familiar = existing.meta_seguro_familiar
        record.atingido_seguro_familiar = existing.atingido_seguro_familiar
      }

      toUpsert.push(record)
    }

    if (!toUpsert.length) {
      return { success: false, error: 'Nenhuma linha válida para importar', data: { errors } }
    }

    // Upsert metas (insert or update based on loja_id + periodo unique constraint)
    try {
      const { data: upserted, error: upsertErr } = await admin
        .from('metas')
        .upsert(toUpsert, { onConflict: 'loja_id,periodo' })
        .select('*')
      
      if (upsertErr) {
        console.error('[server/api/importacoes/dia-a-dia-lojas/import] upsert error:', upsertErr)
        return { success: false, error: upsertErr.message || 'Erro ao importar Dia a Dia', data: { errors, upsertErr } }
      }

      return { success: true, data: { insertedOrUpdated: upserted || [], errors } }
    } catch (e: any) {
      console.error('[server/api/importacoes/dia-a-dia-lojas/import] exception during upsert:', e)
      return { success: false, error: e?.message || 'Erro ao importar', data: null }
    }
  } catch (err: any) {
    console.error('[server/api/importacoes/dia-a-dia-lojas/import] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
