import { useState } from '#app';

/**
 * Composable para gerir um estado de carregamento global.
 *
 * @returns {{
 *   isLoading: import('vue').Ref<boolean>,
 *   startLoading: () => void,
 *   stopLoading: () => void
 * }}
 */
export const useLoading = () => {
  const isLoading = useState('isLoading', () => false);

  const startLoading = () => { isLoading.value = true; };
  const stopLoading = () => { isLoading.value = false; };

  return { isLoading, startLoading, stopLoading };
};