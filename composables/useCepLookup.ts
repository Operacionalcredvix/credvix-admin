// composables/useCepLookup.ts
import { ref } from 'vue';

export const useCepLookup = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Consulta um CEP na API ViaCEP.
   * @param cep O CEP a ser consultado (pode conter máscara).
   * @returns Um objeto com os dados do endereço ou null se não for encontrado.
   */
  const lookupCep = async (cep: string | null | undefined) => {
    const cleanedCep = cep?.replace(/\D/g, '');
    if (!cleanedCep || cleanedCep.length !== 8) {
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      if (data.erro) {
        error.value = 'CEP não encontrado.';
        return null;
      }
      return data;
    } catch (err) {
      error.value = 'Não foi possível consultar o CEP.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, lookupCep };
};