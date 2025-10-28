// @ts-nocheck
// plugins/inactivity-timeout.client.ts
// Encerra a sessão após 60 minutos de inatividade do usuário.
// Mostra aviso 2 minutos antes com opção de continuar conectado.

const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 60 minutos
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutos de aviso
let timerId: any = null;
let warningTimerId: any = null;
let handlingTimeout = false;

function addActivityListeners(resetFn: () => void) {
  const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];
  events.forEach((ev) => window.addEventListener(ev, resetFn, { passive: true }));
  return () => events.forEach((ev) => window.removeEventListener(ev, resetFn));
}

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return;

  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // Estado reativo para controlar o modal
  const showWarningModal = useState('inactivity-warning-modal', () => false);
  const remainingSeconds = useState('inactivity-remaining-seconds', () => 120);
  let countdownInterval: any = null;

  const onTimeout = async () => {
    if (handlingTimeout) return;
    handlingTimeout = true;

    // Fecha o modal se ainda estiver aberto
    showWarningModal.value = false;
    if (countdownInterval) clearInterval(countdownInterval);

    try {
      // Registrar logout por inatividade, se houver login_id
      const loginId = sessionStorage.getItem('login_id');
      if (loginId) {
        try {
          await supabase.rpc('registrar_logout', { p_login_id: Number(loginId) });
        } catch (e) {
          console.warn('[Auditoria] Falha ao registrar logout por inatividade:', e);
        } finally {
          sessionStorage.removeItem('login_id');
          sessionStorage.removeItem('login_tracked');
        }
      }
    } finally {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('[Auth] signOut em inatividade falhou (ignorado):', e);
      }
      // Redireciona para login
      window.location.href = '/login';
    }
  };

  const showWarning = () => {
    showWarningModal.value = true;
    remainingSeconds.value = 120; // 2 minutos em segundos

    // Countdown a cada segundo
    countdownInterval = setInterval(() => {
      remainingSeconds.value--;
      if (remainingSeconds.value <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  const resetTimer = () => {
    if (!user.value) return; // Nada a fazer se não estiver logado
    
    // Limpa timers existentes
    if (timerId) clearTimeout(timerId);
    if (warningTimerId) clearTimeout(warningTimerId);
    if (countdownInterval) clearInterval(countdownInterval);
    
    // Fecha modal se estava aberto
    showWarningModal.value = false;
    handlingTimeout = false;

    // Agenda aviso 2 minutos antes do logout
    warningTimerId = setTimeout(showWarning, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);
    
    // Agenda o logout final
    timerId = setTimeout(onTimeout, INACTIVITY_LIMIT_MS);
  };

  // Expõe função para o modal chamar quando usuário clicar "Continuar"
  nuxtApp.provide('resetInactivityTimer', resetTimer);

  // Inicia/reinicia quando o app monta e o usuário está logado
  nuxtApp.hook('app:mounted', () => {
    resetTimer();
  });

  // Reinicia quando o usuário muda (login/logout)
  watch(user, (u) => {
    if (timerId) clearTimeout(timerId);
    if (warningTimerId) clearTimeout(warningTimerId);
    if (countdownInterval) clearInterval(countdownInterval);
    showWarningModal.value = false;
    handlingTimeout = false;
    if (u) {
      resetTimer();
    }
  }, { immediate: true });

  // Listeners para atividades do usuário
  const removeListeners = addActivityListeners(resetTimer);

  // Cleanup
  nuxtApp.hook('app:unmounted', () => {
    if (timerId) clearTimeout(timerId);
    if (warningTimerId) clearTimeout(warningTimerId);
    if (countdownInterval) clearInterval(countdownInterval);
    removeListeners();
  });
});
