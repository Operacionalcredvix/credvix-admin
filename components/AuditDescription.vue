<template>
  <div class="text-sm text-gray-700">
    <p v-if="summary">{{ summary }}</p>
    
    <div v-else-if="changes.length > 0">
      <span class="font-semibold">Alterações:</span>
      <ul class="list-disc pl-5 mt-1">
        <li v-for="change in changes" :key="change.key" class="text-xs">
          <span class="font-medium">{{ change.key }}:</span>
          <span class="text-red-600 line-through">{{ formatValue(change.old) }}</span>
          <UIcon name="i-heroicons-arrow-right-solid" class="mx-1" />
          <span class="text-green-600">{{ formatValue(change.new) }}</span>
        </li>
      </ul>
    </div>

    <p v-else class="text-gray-400 text-xs">Nenhum detalhe de alteração registado.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  acao: { type: String, required: true },
  descricao: { type: String, default: '{}' },
  entidade: { type: String, required: true },
});

const parsedData = computed(() => {
  try {
    return JSON.parse(props.descricao);
  } catch (e) {
    return { old: null, new: null };
  }
});

// Gera um resumo conciso para ações de CRIAR e EXCLUIR
const summary = computed(() => {
  if (props.acao === 'INSERT' && parsedData.value.new) {
    const newData = parsedData.value.new;
    const identifier = getIdentifier(newData);
    return `Registo ${identifier} foi criado.`;
  }
  if (props.acao === 'DELETE' && parsedData.value.old) {
    const oldData = parsedData.value.old;
    const identifier = getIdentifier(oldData);
    return `Registo ${identifier} foi excluído.`;
  }
  return null;
});

// Calcula as diferenças para a ação de UPDATE
const changes = computed(() => {
  if (props.acao !== 'UPDATE' || !parsedData.value.old || !parsedData.value.new) {
    return [];
  }
  const oldData = parsedData.value.old;
  const newData = parsedData.value.new;
  const diff = [];
  
  for (const key in newData) {
    // Lógica de comparação melhorada
    const oldValue = oldData[key];
    const newValue = newData[key];
    const valuesAreDifferent = !(oldValue === newValue || (oldValue === null && newValue === '') || (oldValue === '' && newValue === null));
    if (key !== 'id' && key !== 'created_at' && valuesAreDifferent) {
      diff.push({
        key,
        old: oldData[key],
        new: newData[key],
      });
    }
  }
  return diff;
});

// Função para obter um "identificador" do registo (ex: nome, número do contrato)
const getIdentifier = (data) => {
  if (!data) return '';
  if (data.nome_completo) return `"${data.nome_completo}"`;
  if (data.nome) return `"${data.nome}"`;
  if (data.nome_instituicao) return `"${data.nome_instituicao}"`;
  if (data.numero_contrato) return `"${data.numero_contrato}"`;
  if (data.title) return `"${data.title}"`;
  return `com ID #${data.id}`;
};

// Formata valores para melhor leitura
const formatValue = (value) => {
  if (value === null || value === '') return 'vazio';
  if (String(value).length > 50) return `"${String(value).substring(0, 50)}..."`;
  return `"${value}"`;
};
</script>