// @ts-nocheck
// plugins/logout-tracker.client.ts
// Objetivo: registrar logout automaticamente quando o usuário fecha a aba
// ou o app fica em background, evitando sessões sem data_logout.

let alreadyAttempted = false;

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return;

  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const ensureLogoutTracked = async (reason = 'auto') => {
    try {
      if (alreadyAttempted) return;
      const loginId = sessionStorage.getItem('login_id');
      if (!loginId) return;
      if (!user.value) {
        // Usuário já não está mais logado; apenas limpa o ID local
        sessionStorage.removeItem('login_id');
        sessionStorage.removeItem('login_tracked');
        return;
      }
      alreadyAttempted = true;
      await supabase.rpc('registrar_logout', { p_login_id: Number(loginId) });
      sessionStorage.removeItem('login_id');
      sessionStorage.removeItem('login_tracked');
    } catch (e) {
      // Melhor esforço; não bloquear saída
      console.warn('[Auditoria] Falha ao registrar logout automático:', e);
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      // Quando a aba fica oculta, há tempo de realizar o RPC
      ensureLogoutTracked('hidden');
    }
  };

  const onPageHide = () => {
    // Disparo de backup; alguns navegadores chamam antes do unload
    ensureLogoutTracked('pagehide');
  };

  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  // Cleanup
  nuxtApp.hook('app:unmounted', () => {
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  });
});
