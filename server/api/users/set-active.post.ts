// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabase.url
  const serviceKey = config.supabaseServiceKey

  if (!supabaseUrl || !serviceKey) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração do Supabase ausente no servidor.' })
  }

  const { user_id, active } = await readBody(event)
  if (!user_id || typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Parâmetros inválidos: user_id (string) e active (boolean) são obrigatórios.' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey)

  try {
    // Tenta usar ban_duration (GoTrue >= 2.56)
    const payload: any = { }
    if (active === false) {
      payload.ban_duration = '*'
    } else {
      payload.ban_duration = 'none'
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, payload)
    if (error) {
      // Fallback: atualiza app_metadata se ban_duration não for suportado
      const { error: fallbackError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        app_metadata: { banned: active ? false : true }
      } as any)
      if (fallbackError) throw fallbackError
    }

    return { ok: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Falha ao atualizar status do usuário.' })
  }
})
