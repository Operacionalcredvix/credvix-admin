/**
 * @composable useGoalCalculations
 * @description Centraliza a lógica de formatação e estilização relacionada a metas.
 */
export const useGoalCalculations = () => {
  /**
   * Formata um valor numérico como moeda brasileira (BRL).
   */
  const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  /**
   * Retorna a cor do texto com base no percentual atingido da meta.
   */
  const getPercentageColor = (percentage?: number | null): string => {
    if (percentage === null || percentage === undefined) return 'text-gray-500';
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  /**
   * Retorna a cor da barra de progresso com base no percentual atingido.
   */
  const getProgressBarColor = (percentage?: number | null): 'green' | 'yellow' | 'red' | 'gray' => {
    if (percentage === null || percentage === undefined) return 'gray';
    if (percentage >= 100) return 'green';
    if (percentage >= 75) return 'yellow';
    return 'red';
  };

  return { formatCurrency, getPercentageColor, getProgressBarColor };
};
