import { watch } from 'vue';
import type { Ref } from 'vue';

export const useInputMasks = () => {
  const applyCpfMask = (cpfRef: Ref<string>) => {
    watch(cpfRef, (newCpf) => {
      if (typeof newCpf !== 'string') return;
      const cleaned = newCpf.replace(/\D/g, '').slice(0, 11);
      let formatted = cleaned;
      if (cleaned.length > 9) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
      } else if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      } else if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      }
      cpfRef.value = formatted;
    });
  };

  const applyPhoneMask = (phoneRef: Ref<string>) => {
    watch(phoneRef, (newPhone) => {
      if (typeof newPhone !== 'string') return;
      const cleaned = newPhone.replace(/\D/g, '').slice(0, 11);
      let formatted = `(${cleaned.slice(0, 2)})`;
      if (cleaned.length > 2) formatted += ` ${cleaned.slice(2, 7)}`;
      if (cleaned.length > 7) formatted += `-${cleaned.slice(7)}`;
      phoneRef.value = formatted;
    });
  };

  return {
    applyCpfMask,
    applyPhoneMask,
  };
};