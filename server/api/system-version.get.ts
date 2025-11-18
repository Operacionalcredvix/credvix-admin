import { serverSupabaseServiceRole } from '#supabase/server'

// Endpoint: /api/system-version
// Objetivo: buscar versão do sistema via RPC no Supabase.
export default eventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseServiceRole(event)

    const { data, error } = await supabase.rpc('get_system_version')

    if (error) {
      console.error('Erro ao buscar system version via RPC:', error)
      return {
        success: false,
        error: (error.message || 'Erro ao executar RPC get_system_version'),
        data: null
      }
    }

    return {
      success: true,
      data: Array.isArray(data) && data.length ? data[0] : data || null
    }
  } catch (err: any) {
    console.error('Erro no endpoint /api/system-version:', err)
    return {
      success: false,
      error: err?.message || 'Erro ao buscar system version',
      data: null
    }
  }
})
