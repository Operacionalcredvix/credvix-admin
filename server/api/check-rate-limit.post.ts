// @ts-nocheck
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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        message: 'Configuração do Supabase ausente'
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifica bloqueio
    const { data, error } = await supabase.rpc('verificar_bloqueio_login', {
      p_email: email,
      p_ip_address: ip
    });

    if (error) {
      console.error('[Rate Limit] Erro ao verificar bloqueio:', error);
      throw createError({
        statusCode: 500,
        message: 'Erro ao verificar rate limit'
      });
    }

    return data[0] || { bloqueado: false, tentativas_restantes: 5, tempo_bloqueio_segundos: 0 };
  } catch (err) {
    console.error('[Rate Limit] Erro:', err);
    throw err;
  }
});
