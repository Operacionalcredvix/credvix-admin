import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // Busca a versão atual do sistema da tabela system_config
    const { data, error } = await admin
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'version')
      .single()

    if (error) {
      console.error('[server/api/system/version] error:', error)
      // Retorna versão padrão em caso de erro
      return { version: '1.0.0' }
    }

    return { version: data?.config_value || '1.0.0' }
  } catch (err: any) {
    console.error('[server/api/system/version] error:', err)
    return { version: '1.0.0' }
  }
})
