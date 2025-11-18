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
      
      // Se a função não existe, retorna fallback permitindo login
      if (error.message?.includes('function') || error.code === '42883') {
        console.warn('[Rate Limit] Função verificar_bloqueio_login não encontrada. Permitindo login.');
        return { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
      }
      
      throw createError({
        statusCode: 500,
        message: 'Erro ao verificar rate limit',
        data: error
      });
    }

    return data?.[0] || { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
  } catch (err) {
    console.error('[Rate Limit] Erro geral:', err);
    
    // Em caso de erro crítico, permite login (fail-open) mas loga o erro
    if (err.statusCode === 400 || err.statusCode === 500) {
      throw err;
    }
    
    // Para outros erros, permite login mas registra
    console.warn('[Rate Limit] Erro não tratado, permitindo login:', err);
    return { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
  }
});
