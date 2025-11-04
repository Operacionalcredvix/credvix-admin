import { eventHandler, createError } from 'h3'

// Endpoint: /api/system-version
// Objetivo: buscar versão do sistema via RPC no Supabase. Tornamos o endpoint
// tolerante: não lança exceções em tempo de execução se a configuração estiver ausente;
// retorna um payload com success: false e mensagem clara.
export default eventHandler(async (event) => {
  try {
    // Tenta obter runtime config do Nuxt (quando disponível) ou cair em process.env
    const maybeUseRuntime = (globalThis as any).useRuntimeConfig
    const runtimeCfg = maybeUseRuntime ? maybeUseRuntime() : undefined

    const supabaseUrl = runtimeCfg?.public?.supabase?.url || process.env.SUPABASE_URL || ''
    // Prioriza chave privada definida em runtimeConfig, senão tenta SERVICE_ROLE_KEY
    const supabaseKey = runtimeCfg?.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      // Retornamos payload sem lançar para evitar stack traces desnecessários em dev
      return {
        success: false,
        error: 'Configuração do Supabase ausente (verifique runtimeConfig ou variáveis de ambiente SUPABASE_URL / SUPABASE_SERVICE_KEY)',
        data: null
      }
    }

    // Import dinâmico para evitar problemas de resolução/ambiente durante build/dev
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)

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
