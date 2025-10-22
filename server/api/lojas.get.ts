// API endpoint para buscar lojas sem problemas de cache do Supabase
// Este endpoint bypassa completamente o cliente Supabase do frontend

import { createClient } from '@supabase/supabase-js'

// @ts-ignore - defineEventHandler é auto-importado pelo Nuxt
export default defineEventHandler(async (event) => {
  try {
    // Cria cliente Supabase server-side
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_KEY || ''
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração Supabase ausente')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

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
