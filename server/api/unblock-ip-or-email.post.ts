// @ts-nocheck
// API para desbloquear manualmente um IP ou email
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, ip } = body;

    if (!email && !ip) {
      throw createError({
        statusCode: 400,
        message: 'Email ou IP é obrigatório'
      });
    }

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

    // Chama função para desbloquear
    const { data, error } = await supabase.rpc('desbloquear_ip_ou_email', {
      p_email: email || null,
      p_ip_address: ip || null
    });

    if (error) {
      console.error('[Rate Limit] Erro ao desbloquear:', error);
      throw createError({
        statusCode: 500,
        message: 'Erro ao desbloquear'
      });
    }

    return { 
      success: true, 
      message: `${data} tentativa(s) removida(s)`,
      count: data 
    };
  } catch (err) {
    console.error('[Rate Limit] Erro:', err);
    throw err;
  }
});
