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
      // ALTERAÇÃO: Trocamos a seleção específica por '*' para buscar todos os dados,
      // incluindo loja_id e regional_id, e mantemos a busca pelo nome do perfil.
      .select('*, perfis(nome)')
      .eq('user_id', user.value.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      profile.value = null;
    } else {
      profile.value = data;
    }
  };

  // Se o utilizador mudar (login/logout), busca o perfil novamente
  watch(user, fetchProfile, { immediate: true });

  return {
    profile,
    fetchProfile
  };
};