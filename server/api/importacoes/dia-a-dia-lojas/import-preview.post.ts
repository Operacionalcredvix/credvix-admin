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

    // load lojas
    const { data: lojas } = await admin.from('lojas').select('id,nome,franquia')

    const normalize = (s: string) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

    const lojaMapByFranquia = new Map((lojas || []).map((l: any) => [String(l.franquia || '').trim().toUpperCase(), { id: l.id, name: l.nome }]))
    const lojaMapByName = new Map((lojas || []).map((l: any) => [normalize(l.nome), { id: l.id, name: l.nome }]))

    // Helper to parse numbers from Excel
    const parseNumber = (v: any) => {
      if (v === null || v === undefined || v === '') return 0
      const num = Number(String(v).replace(/[^0-9,.-]/g, '').replace(',', '.'))
      return Number.isNaN(num) ? 0 : num
    }

    // Extract first column value (store name/franchise code)
    const getFirstColumnValue = (r: any) => {
      const keys = Object.keys(r || {})
      return keys.length ? String(r[keys[0]] || '').trim() : ''
    }

    // Load existing metas for the period
    const lojaIds = Array.from(new Set((lojas || []).map((l: any) => l.id)))
    const { data: existingMetas } = await admin.from('metas').select('*').in('loja_id', lojaIds).eq('periodo', periodo)
    const metasMap = new Map((existingMetas || []).map((m: any) => [m.loja_id, m]))

    const previewRows: any[] = []
    const errors: any[] = []

    // Process each data row (skip if it's a header-like row)
    for (const [i, r] of rows.entries()) {
      // Extract store identifier from first column
      const firstCol = getFirstColumnValue(r)
      const franquiaKey = String(firstCol).trim().toUpperCase()
      
      // Try to match by franchise code first, then by name
      const lojaByFranquia = lojaMapByFranquia.get(franquiaKey) || null
      const lojaByName = lojaMapByName.get(normalize(firstCol)) || null
      const loja = lojaByFranquia || lojaByName || null

      const rowErrors: string[] = []
      if (!loja) {
        rowErrors.push(`Loja não encontrada para '${firstCol}'`)
        errors.push({ row: i + 3, reasons: rowErrors })
        previewRows.push({
          rowNumber: i + 3,
          franquia: firstCol,
          lojaId: null,
          lojaName: null,
          errors: rowErrors,
          parsed: null,
          existing: null
        })
        continue
      }

      // Parse product values from the row
      // The Excel has dual headers: row 1 = product name, row 2 = metric type
      // So in the JSON, columns might be like "CNC_Vlr Liberado", "CNC_meta", etc.
      // We need to extract "Vlr Liberado" and "meta" for each product
      
      const parsed = {
        // Standard products
        cnc_liberado: parseNumber(r['cnc_vlr_liberado'] || r['cnc_vlrliberado'] || r['vlr_liberado_cnc'] || 0),
        meta_cnc: parseNumber(r['cnc_meta'] || r['meta_cnc'] || 0),
        
        card_beneficio_liberado: parseNumber(r['cartao_beneficio_vlr_liberado'] || r['card_beneficio_vlr_liberado'] || r['cartaobeneficio_vlrliberado'] || 0),
        meta_card_beneficio: parseNumber(r['cartao_beneficio_meta'] || r['card_beneficio_meta'] || r['meta_card_beneficio'] || 0),
        
        bmg_card_liberado: parseNumber(r['bmg_card_vlr_liberado'] || r['bmgcard_vlrliberado'] || 0),
        meta_bmg_card: parseNumber(r['bmg_card_meta'] || r['meta_bmg_card'] || 0),
        
        fgts_liberado: parseNumber(r['fgts_vlr_liberado'] || r['fgts_vlrliberado'] || 0),
        meta_fgts: parseNumber(r['fgts_meta'] || r['meta_fgts'] || 0),
        
        // New products
        cp_pra_todos_liberado: parseNumber(r['cp_pra_todos_vlr_liberado'] || r['cppratodos_vlrliberado'] || 0),
        meta_cp_pra_todos: parseNumber(r['cp_pra_todos_meta'] || r['meta_cp_pra_todos'] || 0),
        
        antecipacao_liberado: parseNumber(r['antecipacao_vlr_liberado'] || r['antecipacao_vlrliberado'] || 0),
        meta_antecipacao: parseNumber(r['antecipacao_meta'] || r['meta_antecipacao'] || 0),
        
        // Consig. Privado maps to Consignado
        consignado_liberado: parseNumber(r['consig_privado_vlr_liberado'] || r['consigprivado_vlrliberado'] || r['consignado_vlr_liberado'] || 0),
        meta_consignado: parseNumber(r['consig_privado_meta'] || r['consigprivado_meta'] || r['meta_consignado'] || 0)
      }

      const existing = metasMap.get(loja.id) || null

      previewRows.push({
        rowNumber: i + 3,
        raw: r,
        franquia: firstCol,
        lojaId: loja.id,
        lojaName: loja.name,
        parsed,
        existing,
        errors: rowErrors
      })

      if (rowErrors.length) errors.push({ row: i + 3, reasons: rowErrors })
    }

    return { success: true, data: { previewRows, errors } }
  } catch (err: any) {
    console.error('[server/api/importacoes/dia-a-dia-lojas/import-preview] exception:', err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})
