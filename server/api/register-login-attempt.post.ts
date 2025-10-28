// @ts-nocheck
// API para registrar tentativa de login (sucesso ou falha)
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, sucesso } = body;

    if (!email || typeof sucesso !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'Email e sucesso são obrigatórios'
      });
    }

    // Captura IP e User-Agent
    const ip = getRequestIP(event, { xForwardedFor: true });
    const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown';

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

    // Registra tentativa
    const { data, error } = await supabase.rpc('registrar_tentativa_login', {
      p_email: email,
      p_ip_address: ip,
      p_sucesso: sucesso,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('[Rate Limit] Erro ao registrar tentativa:', error);
      throw createError({
        statusCode: 500,
        message: 'Erro ao registrar tentativa de login'
      });
    }

    return { success: true, tentativa_id: data };
  } catch (err) {
    console.error('[Rate Limit] Erro:', err);
    throw err;
  }
});
