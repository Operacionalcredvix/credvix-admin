import { eventHandler, readBody } from 'h3'

export default eventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) return { success: false, error: 'Supabase não configurado no servidor' }

    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await readBody(event)
    const filePath = body?.filePath || null
    if (!filePath) return { success: false, error: 'filePath ausente' }

    const authHeader = event.node.req.headers?.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader || ''
    if (!token) return { success: false, error: 'Token ausente' }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userData?.user) return { success: false, error: 'Usuário não autenticado' }

    // monta publicUrl (assume bucket is public)
    const { data: urlData } = admin.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null

    // atualiza funcionario onde user_id = user.id usando service role
    const { data: func, error: funcErr } = await admin.from('funcionarios').select('id').eq('user_id', userData.user.id).single()
    if (funcErr || !func) return { success: false, error: 'Funcionário não encontrado' }

    const { error: updErr } = await admin.from('funcionarios').update({ avatar_url: publicUrl }).eq('id', func.id)
    if (updErr) return { success: false, error: updErr.message || 'Erro ao atualizar avatar' }

    return { success: true, data: { publicUrl } }
  } catch (err: any) {
    console.error('[server/api/profile/avatar] exception:', err)
    return { success: false, error: err?.message || 'Erro interno' }
  }
})
