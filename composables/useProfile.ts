import { watch } from 'vue';
import { useState } from 'nuxt/app';

// Declarações globais (injetadas pelo módulo Supabase/Nuxt).
// Mantemos como `any` aqui para evitar erros de tipo no runtime do projeto
// onde esses helpers são disponibilizados automaticamente.
declare const useSupabaseUser: any
declare const useSupabaseClient: any
declare const $fetch: any

// composables/useProfile.ts
export const useProfile = () => {
  const user = useSupabaseUser();

  // Estado para guardar os dados do perfil que vêm da nossa tabela 'funcionarios'
  const profile = useState('profile', () => null);

  // Função para buscar o perfil via endpoint server (usa service role por trás)
  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null;
      return;
    }

    try {
  const session = await useSupabaseClient().auth.getSession();
  const token = session?.data?.session?.access_token || null;
  const headers = token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);

  const res: any = await $fetch('/api/profile', { method: 'GET', headers });
      if (!res || res.success === false) {
        console.error('[useProfile] Erro ao buscar perfil (server):', res?.error || 'Resposta inválida');
        profile.value = null;
        return;
      }

      const data = res.data;
      const lojaData = data.lojas;
      const regionalData = lojaData?.regionais;

      profile.value = {
        ...data,
        loja_nome: lojaData?.nome || null,
        regional_id: lojaData?.regional_id || null,
        nome_regional: regionalData?.nome_regional || null
      };
    } catch (err) {
      console.error('[useProfile] Exceção ao buscar perfil (server):', err);
      profile.value = null;
    }
  };

  // Se o utilizador mudar (login/logout), busca o perfil novamente
  watch(user, fetchProfile, { immediate: true });

  return {
    profile,
    fetchProfile
  };
};