export const useCpfValidation = () => {
  const isValidCPF = (cpf: string | null | undefined): boolean => {
    if (typeof cpf !== 'string') return false;
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

    // Verifica se tem 11 dígitos e se não são todos iguais
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const digits = cpf.split('').map(el => +el);

    // Função para calcular um dígito verificador
    const calcDigit = (sliceEnd: number): number => {
      let sum = 0;
      for (let i = 0, j = sliceEnd + 1; i < sliceEnd; i++, j--) {
        sum += digits[i] * j;
      }
      const rest = (sum * 10) % 11;
      return rest < 10 ? rest : 0;
    };

    return calcDigit(9) === digits[9] && calcDigit(10) === digits[10];
  };

  return {
    isValidCPF,
  };
};