// @ts-nocheck
// composables/useSessionHeartbeat.ts
import { onMounted, onUnmounted } from 'vue';

const HEARTBEAT_INTERVAL = 120 * 1000; // 2 minutos
const TOKEN_EXPIRY_THRESHOLD = 5 * 60; // 5 minutos

// Estado global para garantir apenas uma instância ativa
let globalIntervalId = null;
let isChecking = false;
let instanceCount = 0;

export function useSessionHeartbeat() {
  const user = useSupabaseUser();
  const client = useSupabaseClient();
  const router = useRouter();

  async function checkSession() {
    if (!user.value || isChecking) return;
    
    isChecking = true;
    
    try {
      // Verifica se há comando de logout forçado pendente
      const { data: comandoLogout, error } = await client.rpc('verificar_comando_logout');
      
      // Se houver erro de conexão, apenas loga e continua
      if (error) {
        console.debug('[Heartbeat] Erro ao verificar comando de logout (será tentado novamente):', error.message);
        isChecking = false;
        return;
      }
      
      if (comandoLogout && comandoLogout.length > 0) {
        const comando = comandoLogout[0];
        
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
    try {
      const sessionRes = client.auth.getSession ? await client.auth.getSession() : null;
      if (!sessionRes || !sessionRes.data || !sessionRes.data.session) {
        isChecking = false;
        return;
      }
      
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
    } finally {
      isChecking = false;
    }
  }

  onMounted(() => {
    instanceCount++;
    
    // Apenas a primeira instância cria o intervalo global
    if (!globalIntervalId) {
      console.debug('[Heartbeat] Iniciando heartbeat global');
      checkSession();
      globalIntervalId = setInterval(checkSession, HEARTBEAT_INTERVAL);
    } else {
      console.debug('[Heartbeat] Reutilizando heartbeat existente');
    }
  });

  onUnmounted(() => {
    instanceCount--;
    
    // Apenas limpa o intervalo quando não há mais nenhuma instância ativa
    if (instanceCount <= 0 && globalIntervalId) {
      console.debug('[Heartbeat] Parando heartbeat global');
      clearInterval(globalIntervalId);
      globalIntervalId = null;
      instanceCount = 0;
    }
  });
}
