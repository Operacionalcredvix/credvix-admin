import { createClient } from '@supabase/supabase-js'
import { eventHandler } from 'h3'
export default eventHandler(async (event) => {
  try {
    // Tentamos obter runtimeConfig se disponível (Nuxt), caso contrário caímos no process.env
    const maybeUseRuntime = (globalThis as any).useRuntimeConfig
    const config = maybeUseRuntime ? maybeUseRuntime() : {
      public: { supabase: { url: process.env.SUPABASE_URL } },
      supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY
    }
    const supabaseUrl = config.public?.supabase?.url || process.env.SUPABASE_URL || ''
    // usamos a chave de server definida em runtimeConfig (supabaseServiceKey)
    const supabaseKey = config.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração Supabase ausente (verifique runtimeConfig)')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.rpc('get_system_version')

    if (error) {
      console.error('Erro ao buscar system version via RPC:', error)
      throw error
    }

    // Esperamos um registro ou null
    return {
      success: true,
      data: (data && data.length) ? data[0] : data || null
    }
  } catch (error: any) {
    console.error('Erro no endpoint /api/system-version:', error)
    return {
      success: false,
      error: error.message || 'Erro ao buscar system version',
      data: null
    }
  }
})
