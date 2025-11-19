// Endpoint de teste para verificar variáveis de ambiente
export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  
  return {
    hasSupabaseUrl: !!config.public?.supabase?.url,
    hasSupabaseAnonKey: !!config.public?.supabase?.key,
    hasSupabaseServiceKey: !!config.supabaseServiceKey,
    env: {
      supabaseUrlLength: config.public?.supabase?.url?.length || 0,
      supabaseAnonKeyLength: config.public?.supabase?.key?.length || 0,
      supabaseServiceKeyLength: config.supabaseServiceKey?.length || 0
    }
  };
});
