import { watch } from 'vue';
import { useState } from 'nuxt/app';

// composables/useProfile.ts
export const useProfile = () => {
  const user = useSupabaseUser();
  const client = useSupabaseClient();

  // Estado para guardar os dados do perfil que vêm da nossa tabela 'funcionarios'
  const profile = useState('profile', () => null);

  // Função para buscar o perfil
  const fetchProfile = async () => {
    if (!user.value) {
      profile.value = null;
      return;
    }

    const { data, error } = await client
      .from('funcionarios')
      .select('*, perfis(nome), lider:gerente_id(nome_completo), lojas(id, nome, regional_id, regionais(id, nome_regional))')
      .eq('user_id', user.value.id)
      .single();

    if (error) {
      console.error('[useProfile] Erro ao buscar perfil:', error);
      profile.value = null;
    } else {
      // Extrai campos da loja para facilitar acesso
      const lojaData = data.lojas;
      const regionalData = lojaData?.regionais;
      
      profile.value = {
        ...data,
        loja_nome: lojaData?.nome || null,
        regional_id: lojaData?.regional_id || null,
        nome_regional: regionalData?.nome_regional || null
      };
    }
  };

  // Se o utilizador mudar (login/logout), busca o perfil novamente
  watch(user, fetchProfile, { immediate: true });

  return {
    profile,
    fetchProfile
  };
};