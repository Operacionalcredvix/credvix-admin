// @ts-nocheck
// composables/useSessionHeartbeat.ts
import { onMounted, onUnmounted } from 'vue';

const HEARTBEAT_INTERVAL = 60 * 1000; // 1 minuto
const TOKEN_EXPIRY_THRESHOLD = 5 * 60; // 5 minutos

export function useSessionHeartbeat() {
  const user = useSupabaseUser();
  const client = useSupabaseClient();
  const router = useRouter();
  let intervalId;

  async function checkSession() {
    if (!user.value) return;
    
    // Verifica se há comando de logout forçado pendente
    try {
      const { data: comandoLogout } = await client.rpc('verificar_comando_logout');
      if (comandoLogout && comandoLogout.length > 0) {
        const comando = comandoLogout[0];
        console.log('[Heartbeat] Comando de logout forçado detectado:', comando);
        
        // Marca comando como executado
        await client.rpc('marcar_comando_executado', { 
          p_comando_id: comando.comando_id 
        });
        
        // Registra logout no histórico
        const loginId = sessionStorage.getItem('login_id');
        if (loginId) {
          try {
            await client.rpc('registrar_logout', { p_login_id: Number(loginId) });
          } catch (e) {
            console.warn('[Heartbeat] Falha ao registrar logout:', e);
          }
        }
        
        // Limpa sessão local
        sessionStorage.removeItem('login_id');
        sessionStorage.removeItem('login_tracked');
        
        // Faz logout
        await client.auth.signOut();
        
        // Redireciona com mensagem
        const motivo = comando.motivo || 'Um administrador encerrou sua sessão';
        alert(`Sessão encerrada: ${motivo}`);
        window.location.href = '/login';
        return;
      }
    } catch (e) {
      console.warn('[Heartbeat] Erro ao verificar comando de logout:', e);
    }
    
    // Verifica expiração do token (comportamento original)
    const sessionRes = client.auth.getSession ? await client.auth.getSession() : null;
    if (!sessionRes || !sessionRes.data || !sessionRes.data.session) return;
    const expiresAt = sessionRes.data.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = expiresAt - now;
    if (timeLeft < TOKEN_EXPIRY_THRESHOLD) {
      // Tenta renovar o token
      try {
        await client.auth.refreshSession();
      } catch (e) {
        // Se falhar, força logout
        router.push('/login');
      }
    }
  }  onMounted(() => {
    // Executa imediatamente e depois agenda o intervalo
    checkSession();
    intervalId = setInterval(checkSession, HEARTBEAT_INTERVAL);
  });
  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });
}
