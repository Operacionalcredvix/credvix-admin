import { eventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  try {
    const admin = await serverSupabaseServiceRole(event)

    // Busca a versão atual do sistema via RPC (mesma fonte do layout)
    const { data, error } = await admin.rpc('get_system_version')

    if (error) {
      console.error('[server/api/system/version] error:', error)
      // Retorna versão padrão em caso de erro
      return { version: '1.0.0' }
    }

    // RPC retorna array, pega o primeiro item
    const versionData = Array.isArray(data) && data.length ? data[0] : data
    
    return { version: versionData?.version || '1.0.0' }
  } catch (err: any) {
    console.error('[server/api/system/version] error:', err)
    return { version: '1.0.0' }
  }
})
