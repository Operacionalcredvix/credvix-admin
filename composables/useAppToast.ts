/**
 * @composable useAppToast
 * @description Um wrapper padronizado para o sistema de notificações (toast) do Nuxt UI.
 * Oferece métodos simplificados para exibir mensagens de sucesso, erro e aviso,
 * garantindo consistência visual e de texto em toda a aplicação.
 *
 * @example
 * const { success, error } = useAppToast();
 *
 * function onSave() {
 *   try {
 *     // ... lógica de salvar
 *     success({ title: 'Item salvo com sucesso!' });
 *   } catch (e) {
 *     error({ title: 'Falha ao salvar', description: e.message });
 *   }
 * }
 */
export const useAppToast = () => {
  const toast = useToast();

  const success = (options: { title: string, description?: string }) => {
    toast.add({
      icon: 'i-heroicons-check-circle',
      color: 'green',
      ...options,
    });
  };

  const error = (options: { title: string, description?: string }) => {
    toast.add({
      icon: 'i-heroicons-x-circle',
      color: 'red',
      ...options,
    });
  };

  const warning = (options: { title: string, description?: string }) => {
    toast.add({
      icon: 'i-heroicons-exclamation-triangle',
      color: 'amber',
      ...options,
    });
  };

  return { success, error, warning };
};