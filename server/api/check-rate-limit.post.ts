import { serverSupabaseServiceRole } from '#supabase/server'

// API para verificar rate limit antes de tentar login
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email } = body;

    if (!email) {
      throw createError({
        statusCode: 400,
        message: 'Email é obrigatório'
      });
    }

    // Captura IP
    const ip = getRequestIP(event, { xForwardedFor: true });

    // Cria cliente Supabase com service_role para bypass RLS
    const supabase = await serverSupabaseServiceRole(event);

    // Verifica bloqueio
    const { data, error } = await supabase.rpc('verificar_bloqueio_login', {
      p_email: email,
      p_ip_address: ip
    });

    if (error) {
      console.error('[Rate Limit] Erro ao verificar bloqueio:', error);
      console.error('[Rate Limit] Detalhes:', JSON.stringify(error, null, 2));
      
      // Em caso de qualquer erro, permite login (fail-open) por segurança
      console.warn('[Rate Limit] Permitindo login devido a erro na verificação');
      return { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
    }

    return data?.[0] || { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
  } catch (err: any) {
    console.error('[Rate Limit] Erro geral:', err);
    
    // SEMPRE permite login em caso de erro (fail-open)
    // Registra mas não bloqueia o acesso do usuário
    console.warn('[Rate Limit] Permitindo login devido a exceção não tratada');
    return { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
  }
});
