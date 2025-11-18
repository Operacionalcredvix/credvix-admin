// API endpoint para buscar lojas sem problemas de cache do Supabase
// Este endpoint bypassa completamente o cliente Supabase do frontend

import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseServiceRole(event)

    // Usa a função RPC que retorna JSONB
    const { data, error } = await supabase.rpc('get_lojas_completas')

    if (error) {
      console.error('Erro ao buscar lojas via RPC:', error)
      throw error
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Erro no endpoint /api/lojas:', error)
    return {
      success: false,
      error: error.message || 'Erro ao buscar lojas',
      data: []
    }
  }
})
