import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  const startTime = Date.now()
  console.log('[profile.get] Iniciando requisição...')
  
  try {
    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) {
      console.log('[profile.get] Token ausente')
      return { success: false, error: 'Token de autenticação ausente', data: null }
    }

    console.log('[profile.get] Verificando usuário...')
    const admin = await serverSupabaseServiceRole(event)

    // Adiciona timeout para getUser
    const userPromise = admin.auth.getUser(token)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao verificar usuário')), 5000)
    )
    
    const { data: userData, error: userErr } = await Promise.race([userPromise, timeoutPromise]) as any
    console.log(`[profile.get] getUser completado em ${Date.now() - startTime}ms`)
    
    if (userErr || !userData?.user) {
      console.error('[profile.get] Erro auth:', userErr)
      return { success: false, error: 'Usuário não autenticado', data: null }
    }

    const userId = userData.user.id
    console.log(`[profile.get] Buscando perfil para userId: ${userId}`)

    // Query simplificada com timeout
    const queryPromise = admin
      .from('funcionarios')
      .select(`
        id,
        nome_completo,
        email,
        cpf,
        telefone,
        data_nascimento,
        perfil_id,
        loja_id,
        gerente_id,
        created_at,
        perfis!inner(id, nome),
        lojas!inner(id, nome, regional_id, regionais!inner(id, nome_regional))
      `)
      .eq('user_id', userId)
      .single()
    
    const queryTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 8000)
    )

    const { data, error } = await Promise.race([queryPromise, queryTimeout]) as any
    console.log(`[profile.get] Query completada em ${Date.now() - startTime}ms`)

    if (error) {
      console.error('[server/api/profile] erro ao buscar funcionarios:', error)
      return { success: false, error: error.message || 'Erro ao buscar perfil', data: null }
    }

    console.log(`[profile.get] Sucesso! Total: ${Date.now() - startTime}ms`)
    return { success: true, data }
  } catch (err: any) {
    console.error(`[server/api/profile] error após ${Date.now() - startTime}ms:`, err)
    return { success: false, error: err?.message || 'Erro interno', data: null }
  }
})