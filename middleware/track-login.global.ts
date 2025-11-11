// Middleware para registrar logins automaticamente
// @ts-nocheck
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Executa apenas no cliente
  if (process.server) return
  
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  
  // Verifica se o usuário está autenticado e ainda não registrou o login nesta sessão
  if (user.value && !sessionStorage.getItem('login_tracked')) {
    try {
      // Captura informações do cliente
      const clientInfo = await $fetch('/api/get-client-info')
      
      // Registra o login no banco usando a função SQL
      const { data, error } = await supabase.rpc('registrar_login', {
        p_user_id: user.value.id,
        p_ip_address: clientInfo.ip,
        p_user_agent: clientInfo.userAgent,
        p_dispositivo: clientInfo.dispositivo,
        p_navegador: clientInfo.navegador,
        p_sistema_operacional: clientInfo.sistemaOperacional
      })
      
      if (error) {
        console.error('[Login Tracking] Erro ao registrar login:', error)
      } else {
        // Marca como registrado nesta sessão
        sessionStorage.setItem('login_tracked', 'true')
        // Armazena o ID do login para poder registrar o logout depois
        if (data) {
          sessionStorage.setItem('login_id', data.toString())
        }
      }
    } catch (err) {
      console.error('[Login Tracking] Erro ao capturar informações:', err)
    }
  }
})
