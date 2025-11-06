<template>
  <div>
    <header class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary-500 text-3xl font-bold">Gestão de Metas</h1>
          <p class="text-gray-500 mt-1">Defina e acompanhe as metas mensais das lojas.</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton icon="i-heroicons-plus-circle" size="lg" @click="openModal()">
            Nova Meta
          </UButton>
          <UButton icon="i-heroicons-arrow-up-tray" size="lg" color="primary" variant="ghost" @click="triggerImport">
            Importar Excel
          </UButton>
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFile" />
        </div>
      </div>
    </header>

    <!-- Filtros -->
    <UCard class="mb-8">
      <div class="flex items-end gap-4">
        <UFormGroup label="Período" name="period">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela de Metas -->
    <div v-if="pending" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="text-2xl animate-spin" />
      <p>A carregar metas...</p>
    </div>
    <div v-else-if="groupedGoals.length === 0" class="text-center py-10 text-gray-500">
      <UIcon name="i-heroicons-trophy" class="text-4xl" />
      <p class="mt-2">Nenhuma meta encontrada para o período selecionado.</p>
    </div>
    <div v-else class="space-y-8">
      <UCard v-for="group in groupedGoals" :key="group.coordinatorName">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-primary-600">Coordenador: {{ group.coordinatorName }}</h3>
            <div class="flex gap-6 text-right">
              <div>
                <p class="text-sm text-gray-500">Total Meta Multi Volume</p>
                <p class="text-xl font-bold text-gray-800 dark:text-gray-200">{{ formatCurrency(group.totalMetaMultiVolume) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Atingido</p>
                <p class="text-xl font-bold text-primary-500">{{ formatCurrency(group.totalAtingido) }}</p>
              </div>
            </div>
          </div>
        </template>
          <!-- Gráfico de Comparação -->
          <div class="mb-8 h-80">
            <Bar :data="group.chartData" :options="chartOptions" />
          </div>

        <UTable :rows="group.goals" :columns="columns">
          <template #loja-data="{ row }">
            <span class="font-medium">{{ row.loja_nome }}</span>
          </template>

          <template #percentual_multi_volume-data="{ row }">
            <GoalProgress :current-value="row.atingido_multi_volume" :goal-value="row.meta_multi_volume"
              :tooltip-info="{ divisor_meta: row.divisor_meta, orçados: row.orçados, qtd_consultores_ativos: row.qtd_consultores_ativos }" />
          </template>

          <!-- As colunas de valor agora mostram o atingido vs a meta -->
          <template #meta_cnc-data="{ row }"><GoalProgress :current-value="row.atingido_cnc" :goal-value="row.meta_cnc" /></template>
          <template #meta_card-data="{ row }"><GoalProgress :current-value="row.atingido_card" :goal-value="row.meta_card" /></template>
          <template #meta_card_beneficio-data="{ row }"><GoalProgress :current-value="row.atingido_card_beneficio" :goal-value="row.meta_card_beneficio" /></template>
          <template #meta_consignado-data="{ row }"><GoalProgress :current-value="row.atingido_consignado" :goal-value="row.meta_consignado" /></template>
          <template #meta_fgts-data="{ row }"><GoalProgress :current-value="row.atingido_fgts" :goal-value="row.meta_fgts" /></template>

          <template #meta_bmg_med-data="{ row }">
            <GoalProgress :current-value="row.atingido_bmg_med" :goal-value="row.meta_bmg_med" format-as="number" />
          </template>
          <template #meta_seguro_familiar-data="{ row }">
            <GoalProgress :current-value="row.atingido_seguro_familiar" :goal-value="row.meta_seguro_familiar" format-as="number" />
          </template>

          <template #actions-data="{ row }">
            <UButton icon="i-heroicons-pencil" size="sm" color="gray" variant="ghost" @click="handleEdit(row)" />
            <UButton icon="i-heroicons-trash" size="sm" color="red" variant="ghost" @click="handleDelete(row)" />
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- Modal para Nova/Edição de Meta -->
    <UModal v-model="isModalOpen">
      <UForm :state="formData" @submit="handleSave">
        <UCard>
          <template #header>
            <h2 class="text-lg font-bold">{{ isEditing ? 'Editar Meta' : 'Definir Nova Meta' }}</h2>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Loja" name="loja_id" required>
              <USelectMenu v-model="formData.loja_id" :options="lojas" value-attribute="id" option-attribute="nome"
                placeholder="Selecione a loja" :disabled="isEditing" />
            </UFormGroup>
            <UFormGroup label="Período" name="periodo" required>
              <UInput type="month" v-model="formData.periodo" :disabled="isEditing" />
            </UFormGroup>

            <UFormGroup label="Qtd. Orçados" name="orçados" required>
              <UInput v-model.number="formData.orçados" type="number" placeholder="Nº ideal de consultores" />
            </UFormGroup>
            <div class="grid grid-cols-2 gap-4 pt-4">
              <UFormGroup label="CNC (Valor)" name="meta_cnc"><UInput v-model.number="formData.meta_cnc" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="CARD (Valor)" name="meta_card"><UInput v-model.number="formData.meta_card" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="CARD Benefício (Valor)" name="meta_card_beneficio"><UInput v-model.number="formData.meta_card_beneficio" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="Consignado (Valor)" name="meta_consignado"><UInput v-model.number="formData.meta_consignado" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="FGTS (Valor)" name="meta_fgts"><UInput v-model.number="formData.meta_fgts" type="number" step="0.01" /></UFormGroup>
              <UFormGroup label="BMG MED (Qtd)" name="meta_bmg_med"><UInput v-model.number="formData.meta_bmg_med" type="number" /></UFormGroup>
              <UFormGroup label="Seguro Familiar (Qtd)" name="meta_seguro_familiar"><UInput v-model.number="formData.meta_seguro_familiar" type="number" /></UFormGroup>
            </div>

            <div class="border-t pt-4 mt-4">
              <p class="text-sm text-gray-500">Meta Multi Volume (Calculado)</p>
              <p class="text-xl font-bold text-primary-500">{{ formatCurrency(metaMultiVolumeCalculada) }}</p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-4">
              <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" :loading="saving">Salvar</UButton>
            </div>
          </template>
        </UCard>
      </UForm>
    </UModal>
    <!-- Store picker overlay (rendered at the end so it appears above) -->
    <!-- storePicker overlay removed: using inline dropdown instead -->

    <!-- Modal de Pré-visualização de Importação -->
    <UModal v-model="isImportPreviewOpen" size="full">
      <!-- Wrapper to force modal to use custom size (fixed, centered) and allow internal scrolling; resizable -->
      <div ref="resizeWrapper" :style="wrapperStyle" class="p-4">
        <!-- allow overflow in fullscreen so inner scrollbars work -->
        <UCard :class="['h-full relative', isFullscreen ? 'overflow-auto' : 'overflow-hidden']" style="width:100%; height:100%; min-width:600px;">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <h2 class="text-lg font-bold">Pré-visualização da Importação</h2>
            <div class="flex items-center gap-3">
              <input v-model="previewSearch" placeholder="Pesquisar loja..." class="px-3 py-2 border rounded text-sm w-64" />
              <USelectMenu v-model="importFilter" :options="filterOptions" option-attribute="label" value-attribute="value" size="md" :style="{ minWidth: '220px' }" class="text-sm" />
              <UButton size="md" variant="ghost" :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'" @click="toggleFullscreen">
                {{ isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia' }}
              </UButton>
            </div>
          </div>
        </template>

          <div class="space-y-4 h-full flex flex-col">
          <div v-if="previewErrors.length" class="p-2 bg-amber-50 rounded">
            <p class="font-medium text-sm">Erros encontrados no ficheiro:</p>
            <ul class="text-xs list-disc pl-5">
              <li v-for="err in previewErrors" :key="err.row">Linha {{ err.row }}: {{ err.reason }}</li>
            </ul>
          </div>

          <!-- Scrollable area: both vertical and horizontal scrollbars enabled -->
          <div class="flex-1" style="overflow: auto;">
            <div style="min-width:1400px; white-space: nowrap;">
            <table class="w-full text-sm table-auto" style="white-space: nowrap;">
              <thead>
                <tr class="text-left text-xs text-gray-500">
                  <th class="p-2">#</th>
                  <th class="p-2">Loja (arquivo)</th>
                  <th class="p-2">Loja encontrada</th>
                  <th class="p-2">Ação</th>
                  <th class="p-2">CNC<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">CARD<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">CARD Benefício<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">FGTS / CLT<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">Consignado<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">BMG MED<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">Seguro Familiar<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">QTD Orçados<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">Meta Multi Volume<br/><span class="text-xs text-gray-400">Atual → Novo</span></th>
                  <th class="p-2">Observações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredPreviewRows" :key="row.rowIndex" :class="['border-t align-top', row.isTotal ? 'bg-amber-50' : '']">
                  <td class="p-2 align-top">{{ row.rowIndex }}</td>
                  <td class="p-2 align-top">{{ row.lojaName }}</td>
                  <td class="p-2 align-top">
                    <div v-if="row.isTotal">— Total do grupo —</div>
                    <div v-else>
                      <div v-if="row.possibleMatches && row.possibleMatches.length">
                        <USelectMenu v-model="row.selectedLojaId" :options="row.possibleMatches.map(m=>({ label: m.name, value: m.id }))" option-attribute="label" value-attribute="value" size="sm" :style="{ minWidth: '260px' }" class="max-w-[340px]" />
                        <div class="text-xs text-gray-400 mt-1">Confiança: {{ Math.round((row.bestMatchScore || 0) * 100) }}%</div>
                      </div>
                      <div v-else>
                        {{ row.lojaId ? (lojas.find(l=>String(l.id)===String(row.lojaId))?.nome || row.lojaId) : '—' }}
                      </div>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div v-if="row.isTotal">Total</div>
                    <div v-else>
                      <div v-if="row.error" class="text-red-500">Erro</div>
                      <div v-else>
                        <div v-if="!row.existing" class="flex items-center gap-2">
                          <span title="Inserir: não existe meta no período; pode gravar esta linha individualmente ou usar 'Confirmar e Gravar' para enviar todas as linhas de uma só vez">Inserir</span>
                          <UButton size="sm" color="primary" variant="ghost" :loading="rowSaving[row.rowIndex]" @click="() => saveSingleRow(row)">Gravar</UButton>
                        </div>
                        <div v-else class="flex flex-col">
                          <div class="flex items-center gap-2">
                            <div class="text-amber-600">Atualizar</div>
                            <UButton size="sm" color="primary" variant="ghost" :loading="rowSaving[row.rowIndex]" @click="() => saveSingleRow(row)">Gravar</UButton>
                          </div>
                          <div class="text-xs text-gray-500 mt-1" v-if="changedFields(row).length">Campos: {{ changedFields(row).join(', ') }}</div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- For each product column show Atual → Novo and highlight if changed; for totals show Reportado → Soma Calculada -->
                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum?.meta_cnc || 0) : formatCurrency(row.existing?.meta_cnc || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_cnc || 0) > 0.0001) : isChanged(row, 'meta_cnc'), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(row.parsed?.meta_cnc || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_cnc || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_cnc || 0) <= 0.0001}">Δ {{ formatCurrency(row.diffs?.meta_cnc || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum?.meta_card || 0) : formatCurrency(row.existing?.meta_card || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_card || 0) > 0.0001) : isChanged(row, 'meta_card'), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(row.parsed?.meta_card || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_card || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_card || 0) <= 0.0001}">Δ {{ formatCurrency(row.diffs?.meta_card || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum?.meta_card_beneficio || 0) : formatCurrency(row.existing?.meta_card_beneficio || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_card_beneficio || 0) > 0.0001) : isChanged(row, 'meta_card_beneficio'), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(row.parsed?.meta_card_beneficio || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_card_beneficio || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_card_beneficio || 0) <= 0.0001}">Δ {{ formatCurrency(row.diffs?.meta_card_beneficio || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum?.meta_fgts || 0) : formatCurrency(row.existing?.meta_fgts || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_fgts || 0) > 0.0001) : isChanged(row, 'meta_fgts'), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(row.parsed?.meta_fgts || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_fgts || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_fgts || 0) <= 0.0001}">Δ {{ formatCurrency(row.diffs?.meta_fgts || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum?.meta_consignado || 0) : formatCurrency(row.existing?.meta_consignado || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_consignado || 0) > 0.0001) : isChanged(row, 'meta_consignado'), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(row.parsed?.meta_consignado || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_consignado || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_consignado || 0) <= 0.0001}">Δ {{ formatCurrency(row.diffs?.meta_consignado || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? (row.groupSum?.meta_bmg_med || 0) : (row.existing?.meta_bmg_med || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_bmg_med || 0) > 0.0001) : isChanged(row, 'meta_bmg_med'), 'text-green-700': row.parsed && !row.existing}">{{ (row.parsed?.meta_bmg_med || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_bmg_med || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_bmg_med || 0) <= 0.0001}">Δ {{ (row.diffs?.meta_bmg_med || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? (row.groupSum?.meta_seguro_familiar || 0) : (row.existing?.meta_seguro_familiar || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.meta_seguro_familiar || 0) > 0.0001) : isChanged(row, 'meta_seguro_familiar'), 'text-green-700': row.parsed && !row.existing}">{{ (row.parsed?.meta_seguro_familiar || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.meta_seguro_familiar || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.meta_seguro_familiar || 0) <= 0.0001}">Δ {{ (row.diffs?.meta_seguro_familiar || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? (row.groupSum?.orcados || 0) : (row.existing?.orcados || 0) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? (Math.abs(row.diffs?.orcados || 0) > 0.0001) : isChanged(row, 'orcados'), 'text-green-700': row.parsed && !row.existing}">{{ (row.parsed?.orcados || 0) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': Math.abs(row.diffs?.orcados || 0) > 0.0001, 'text-gray-500': Math.abs(row.diffs?.orcados || 0) <= 0.0001}">Δ {{ (row.diffs?.orcados || 0) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top">
                    <div class="flex flex-col">
                      <span class="text-xs text-gray-500">{{ row.isTotal ? formatCurrency(row.groupSum ? ( (row.groupSum.meta_cnc||0) + (row.groupSum.meta_card||0) + (row.groupSum.meta_card_beneficio||0) + (row.groupSum.meta_consignado||0) + (row.groupSum.meta_fgts||0) ) : 0) : formatCurrency(calcMultiVolume(row.existing)) }}</span>
                      <span :class="{'font-semibold': row.isTotal ? row.anyDiff : isChangedMulti(row), 'text-green-700': row.parsed && !row.existing}">{{ formatCurrency(calcMultiVolume(row.parsed)) }}</span>
                      <span v-if="row.isTotal" class="text-xs" :class="{'text-red-600': row.anyDiff, 'text-gray-500': !row.anyDiff}">Δ Total: {{ formatCurrency(Object.values(row.diffs || {}).reduce((s,n)=>s + Number(n||0),0)) }}</span>
                    </div>
                  </td>

                  <td class="p-2 align-top text-xs">
                    <div v-if="row.error" class="text-red-500">{{ row.error }}</div>
                    <div v-else>
                      <span v-if="!row.lojaId && !row.isTotal" class="text-amber-600">Loja não encontrada</span>
                      <span v-else-if="row.existing && changedFields(row).length === 0 && !row.isTotal" class="text-gray-500">Sem alterações</span>
                      <span v-else-if="row.isTotal && row.anyDiff" class="text-red-600">Divergência no total</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between items-center w-full">
            <div class="text-xs text-gray-500">Linhas mostradas: {{ filteredPreviewRows.length }} / {{ previewRows.length }}</div>
            <div class="flex justify-end gap-4">
              <UButton color="gray" variant="ghost" @click="isImportPreviewOpen = false">Cancelar</UButton>
              <UButton color="primary" @click="confirmImport" :loading="saving">Confirmar e Gravar</UButton>
            </div>
          </div>
        </template>
          <!-- resize handle (bottom-right) -->
          <div @mousedown="startResize" class="absolute right-3 bottom-3 w-5 h-5 cursor-se-resize bg-gray-200/60 dark:bg-gray-700/60 rounded-md flex items-center justify-center" title="Arraste para redimensionar">
            <div class="w-3 h-3 rotate-45 border-b border-r border-gray-500"></div>
          </div>
        </UCard>
      </div>
    </UModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { useGoalCalculations } from '~/composables/useGoalCalculations';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

definePageMeta({
  middleware: 'auth',
  profiles: ['Master','Diretoria','Gerência']
});

const supabase = useSupabaseClient();
const toast = useToast();
const { formatCurrency } = useGoalCalculations();

// --- ESTADO DA PÁGINA ---
const isModalOpen = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)); // Formato YYYY-MM

// --- DADOS DO FORMULÁRIO ---
const getInitialFormData = () => ({
  id: null,
  loja_id: null,
  periodo: selectedPeriod.value,
  orçados: 1,
  meta_cnc: 0,
  meta_card: 0,
  meta_card_beneficio: 0,
  meta_consignado: 0,
  meta_bmg_med: 0,
  meta_seguro_familiar: 0,
  meta_fgts: 0,
});
const formData = reactive(getInitialFormData());

// --- CÁLCULO COMPUTADO PARA O FORMULÁRIO ---
const metaMultiVolumeCalculada = computed(() => {
  return (formData.meta_cnc || 0) + (formData.meta_card || 0) + 
         (formData.meta_card_beneficio || 0) + (formData.meta_consignado || 0) + 
         (formData.meta_fgts || 0);
});

// --- CARREGAMENTO DE DADOS ---
const { data: lojas } = await useAsyncData('lojas-para-metas', async () => {
  const { data } = await supabase.from('lojas').select('id, nome').order('nome');
  return data || [];
});

const { data: goals, pending, refresh } = await useAsyncData('metas-progresso', async () => {
  const firstDayOfMonth = `${selectedPeriod.value}-01`;
  try {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token || null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await $fetch('/api/dashboard/metas', { method: 'POST', headers, body: { p_periodo: firstDayOfMonth } });
    if (!res || res.success === false) {
      console.error('Erro ao buscar metas (server):', res?.error || 'Resposta inválida');
      return [];
    }
    return res.data || [];
  } catch (err) {
    console.error('Exceção ao buscar metas (server):', err);
    return [];
  }
}, { watch: [selectedPeriod] });

// --- COLUNAS E FORMATAÇÃO DA TABELA ---
const columns = [
  { key: 'loja_nome', label: 'Loja', class: 'w-1/12' },
  { key: 'percentual_multi_volume', label: '% Multi Volume', class: 'w-2/12' },
  { key: 'meta_cnc', label: 'CNC' },
  { key: 'meta_card', label: 'CARD' },
  { key: 'meta_card_beneficio', label: 'CARD Benefício' },
  { key: 'meta_consignado', label: 'Consignado' },
  { key: 'meta_bmg_med', label: 'BMG MED' },
  { key: 'meta_seguro_familiar', label: 'Seguro Familiar' },
  { key: 'meta_fgts', label: 'FGTS' },
  { key: 'actions', label: 'Ações', sortable: false }
];

const groupedGoals = computed(() => {
  if (!goals.value) return [];

  // 1. Agrupa as metas por coordenador (os dados já vêm calculados da VIEW)
  const groups = goals.value.reduce((acc, goal) => {
    const coordinatorName = goal.coordenador_nome || 'Sem Coordenador';
    if (!acc[coordinatorName]) {
      acc[coordinatorName] = { goals: [] };
    }
    acc[coordinatorName].goals.push(goal);
    return acc;
  }, {});

  // 2. Formata os dados para a tabela e para o gráfico
  return Object.entries(groups).map(([coordinatorName, groupData]) => {
    const goalsInGroup = groupData.goals;
    const chartLabels = goalsInGroup.map(g => g.loja_nome || 'N/A');
    const chartDataMeta = goalsInGroup.map(g => g.meta_multi_volume);
    const chartDataAtingido = goalsInGroup.map(g => g.atingido_multi_volume);

    const totalMetaMultiVolume = goalsInGroup.reduce((sum, goal) => sum + goal.meta_multi_volume, 0);
    const totalAtingido = goalsInGroup.reduce((sum, goal) => sum + goal.atingido_multi_volume, 0);

    return {
      coordinatorName,
      goals: goalsInGroup,
      totalMetaMultiVolume,
      totalAtingido,
      chartData: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Meta Multi Volume',
            backgroundColor: '#a5b4fc', // Indigo-300
            data: chartDataMeta
          },
          {
            label: 'Valor Atingido',
            backgroundColor: '#4f46e5', // Indigo-600
            data: chartDataAtingido
          }
        ]
      }
    };
  });
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

// --- IMPORTAÇÃO DE EXCEL ---
const fileInput = ref(null)
const triggerImport = () => {
  fileInput.value?.click()
}

const handleFile = async (e) => {
  const f = e.target.files && e.target.files[0]
  if (!f) return

  try {
    // tenta importar xlsx dinamicamente
    let XLSX
    try {
      XLSX = (await import('xlsx')).default || (await import('xlsx'))
    } catch (err) {
      toast.add({ title: 'Erro', description: 'Biblioteca xlsx não encontrada. Execute `npm install xlsx` e reinicie o dev.', color: 'red' })
      return
    }

    const arrayBuffer = await f.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (!Array.isArray(json) || json.length === 0) {
      toast.add({ title: 'Aviso', description: 'Arquivo vazio ou formato inválido.', color: 'orange' })
      return
    }

    // prepara body para endpoint
    const periodo = `${selectedPeriod.value}-01`
    const rows = json.map(r => {
      // normaliza chaves (mantém exatamente as colunas esperadas em PT)
      const normalized = {}
      for (const k of Object.keys(r)) {
        // @ts-ignore
        normalized[k.toString().trim()] = r[k]
      }
      return normalized
    })

    // Preview step: call preview endpoint and show modal for confirmation
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token || null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const previewRes = await $fetch('/api/metas/import-preview', { method: 'POST', headers, body: { periodo, rows } })
    if (!previewRes || previewRes.success === false) {
      toast.add({ title: 'Erro', description: previewRes?.error || 'Falha ao gerar preview', color: 'red' })
      return
    }

  // initialize per-row selectedLojaId so user can override when matching is imprecise
  const received = previewRes.data?.previewRows || []
  previewRows.value = received.map(r => ({ ...r, selectedLojaId: r.lojaId || (r.possibleMatches && r.possibleMatches[0]?.id) || null }))
  previewErrors.value = previewRes.data?.errors || []
  isImportPreviewOpen.value = true
  } catch (err) {
    console.error('Erro ao importar arquivo:', err)
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
    } finally {
      // reset file input
      try { e.target.value = null } catch (e) {}
    }
}

const previewRows = ref([])
const previewErrors = ref([])
const isImportPreviewOpen = ref(false)

// filtros e busca para o modal de preview
const previewSearch = ref('')
const importFilter = ref('all')
const filterOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'errors', label: 'Com Erro' },
  { value: 'inserts', label: 'Inserir' },
  { value: 'updates', label: 'Atualizar' },
  { value: 'changed', label: 'Somente Alteradas' }
]

const fieldKeys = ['meta_cnc','meta_card','meta_card_beneficio','meta_fgts','meta_consignado','meta_bmg_med','meta_seguro_familiar','orcados']

const isChanged = (row, key) => {
  if (!row || !row.parsed) return false
  if (!row.existing) return Boolean(row.parsed[key] || row.parsed[key] === 0)
  const existingVal = Number(row.existing[key] ?? 0)
  const parsedVal = Number(row.parsed[key] ?? 0)
  return existingVal !== parsedVal
}

const isChangedMulti = (row) => {
  if (!row) return false
  const ex = calcMultiVolume(row.existing || {})
  const ne = calcMultiVolume(row.parsed || {})
  return ex !== ne
}

const changedFields = (row) => {
  if (!row || !row.parsed) return []
  if (!row.existing) return fieldKeys.filter(k => Boolean(row.parsed[k] || row.parsed[k] === 0))
  return fieldKeys.filter(k => isChanged(row, k))
}

const calcMultiVolume = (obj) => {
  if (!obj) return 0
  const a = Number(obj.meta_cnc || 0)
  const b = Number(obj.meta_card || 0)
  const c = Number(obj.meta_card_beneficio || 0)
  const d = Number(obj.meta_consignado || 0)
  const e = Number(obj.meta_fgts || 0)
  return a + b + c + d + e
}

const filteredPreviewRows = computed(() => {
  const q = String(previewSearch.value || '').toLowerCase().trim()
  return (previewRows.value || []).filter(r => {
    if (importFilter.value === 'errors' && (!r.error)) return false
    if (importFilter.value === 'inserts' && r.existing) return false
    if (importFilter.value === 'updates' && !r.existing) return false
    if (importFilter.value === 'changed') {
      if (!changedFields(r).length) return false
    }
    if (q) {
      const loja = String(r.lojaName || '').toLowerCase()
      if (!loja.includes(q)) return false
    }
    return true
  }).sort((a,b) => (Number(a.rowIndex||0) - Number(b.rowIndex||0)))
})

// inline dropdown used; overlay picker removed

// --- Resizable / Fullscreen modal state ---
const resizeWrapper = ref(null)
const modalWidth = ref('1200px')
const modalHeight = ref('70vh')
const isFullscreen = ref(false)
let prevWidth = null
let prevHeight = null
let isResizing = false
let startX = 0
let startY = 0
let startWidth = 0
let startHeight = 0

const startResize = (e) => {
  e.preventDefault()
  isResizing = true
  startX = e.clientX
  startY = e.clientY
  const el = resizeWrapper.value
  if (el) {
    const rect = el.getBoundingClientRect()
    startWidth = rect.width
    startHeight = rect.height
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopResize)
}

const onMouseMove = (ev) => {
  if (!isResizing) return
  const dx = ev.clientX - startX
  const dy = ev.clientY - startY
  const newW = Math.max(600, Math.round(startWidth + dx))
  const newH = Math.max(300, Math.round(startHeight + dy))
  modalWidth.value = `${newW}px`
  modalHeight.value = `${newH}px`
}

const stopResize = () => {
  isResizing = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  stopResize()
})

const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    // enter fullscreen: save previous size
    prevWidth = modalWidth.value
    prevHeight = modalHeight.value
    isFullscreen.value = true
    // disable body scroll while full
    try { document.body.style.overflow = 'hidden' } catch (e) {}
    // ensure listeners for escape
    window.addEventListener('keydown', onKeyDown)
  } else {
    // exit fullscreen: restore size
    isFullscreen.value = false
    modalWidth.value = prevWidth || '1200px'
    modalHeight.value = prevHeight || '70vh'
    try { document.body.style.overflow = '' } catch (e) {}
    window.removeEventListener('keydown', onKeyDown)
  }
}

const onKeyDown = (e) => {
  if (e.key === 'Escape' && isFullscreen.value) {
    toggleFullscreen()
  }
}

const wrapperStyle = computed(() => {
  if (isFullscreen.value) {
    return { width: '100vw', height: '100vh', position: 'fixed', left: '0', top: '0', transform: 'none', zIndex: 9999 }
  }
  return { width: modalWidth.value, height: modalHeight.value, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
})

const confirmImport = async () => {
  if (!previewRows.value || previewRows.value.length === 0) {
    toast.add({ title: 'Erro', description: 'Nenhuma linha para importar', color: 'red' })
    return
  }
  saving.value = true
  try {
    const periodo = `${selectedPeriod.value}-01`
    const rowsToSend = previewRows.value.filter(p => (p.selectedLojaId || p.lojaId) && p.parsed).map(p => {
      return {
        LOJAS: p.lojaName,
        LOJA_ID: p.selectedLojaId || p.lojaId,
        CNC: p.parsed.meta_cnc,
        CARD: p.parsed.meta_card,
        'CARD BENEFICIO': p.parsed.meta_card_beneficio,
        'FGTS / CLT': p.parsed.meta_fgts,
        CONSIGNADO: p.parsed.meta_consignado,
        BMGMED: p.parsed.meta_bmg_med,
        'SEGURO FAMILIAR': p.parsed.meta_seguro_familiar,
        'QTD ORÇADOS': p.parsed.orcados
      }
    })

    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token || null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await $fetch('/api/metas/import', { method: 'POST', headers, body: { periodo, rows: rowsToSend } })
    if (!res || res.success === false) {
      toast.add({ title: 'Erro', description: res?.error || 'Falha ao importar metas', color: 'red' })
      return
    }

    const inserted = res.data?.insertedOrUpdated?.length || 0
    const errs = res.data?.errors || []
    toast.add({ title: 'Importação concluída', description: `${inserted} metas inseridas/atualizadas. ${errs.length} erros.`, color: errs.length ? 'amber' : 'green' })
    isImportPreviewOpen.value = false
    await refresh()
  } catch (err) {
    console.error('Erro ao confirmar import:', err)
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
  } finally {
    saving.value = false
  }
}

// --- Gravar linha individualmente ---
const rowSaving = reactive({})

const saveSingleRow = async (row) => {
  if (!row || !row.parsed) return
  const rowKey = row.rowIndex || Math.random()
  rowSaving[rowKey] = true
  try {
    const periodo = `${selectedPeriod.value}-01`
    const payloadRow = {
      LOJAS: row.lojaName,
      LOJA_ID: row.selectedLojaId || row.lojaId,
      CNC: row.parsed.meta_cnc,
      CARD: row.parsed.meta_card,
      'CARD BENEFICIO': row.parsed.meta_card_beneficio,
      'FGTS / CLT': row.parsed.meta_fgts,
      CONSIGNADO: row.parsed.meta_consignado,
      BMGMED: row.parsed.meta_bmg_med,
      'SEGURO FAMILIAR': row.parsed.meta_seguro_familiar,
      'QTD ORÇADOS': row.parsed.orcados
    }

    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token || null
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await $fetch('/api/metas/import', { method: 'POST', headers, body: { periodo, rows: [payloadRow] } })
    if (!res || res.success === false) {
      toast.add({ title: 'Erro', description: res?.error || 'Falha ao gravar linha', color: 'red' })
      return
    }

    const rec = (res.data?.insertedOrUpdated && res.data.insertedOrUpdated[0]) || null
    if (rec) {
      // update preview row to reflect it now exists
      row.existing = rec
      toast.add({ title: 'Gravado', description: `Meta da loja ${row.lojaName} gravada.`, color: 'green' })
      await refresh()
    }
  } catch (err) {
    console.error('Erro ao gravar linha:', err)
    toast.add({ title: 'Erro', description: err?.message || String(err), color: 'red' })
  } finally {
    rowSaving[rowKey] = false
  }
}

// --- AÇÕES CRUD ---
const openModal = () => {
  isEditing.value = false;
  Object.assign(formData, getInitialFormData());
  isModalOpen.value = true;
};

const handleEdit = (row) => {
  // A VIEW já traz todos os dados necessários, não precisa mais buscar o original.
  const originalGoal = goals.value.find(g => g.id === row.id);
  if (!originalGoal) {
    toast.add({ title: 'Erro', description: 'Não foi possível encontrar os dados originais da meta.', color: 'red' });
    return;
  }

  isEditing.value = true;
  // Usa o registo original para preencher o formulário
  Object.assign(formData, { ...originalGoal, periodo: originalGoal.periodo.slice(0, 7) });
  isModalOpen.value = true;
};

const handleSave = async () => {
  saving.value = true;
  try {
    // Filtra o formData para enviar apenas as colunas que existem na tabela 'metas'
    const dataToSave = {
      id: formData.id,
      loja_id: formData.loja_id,
      periodo: `${formData.periodo}-01`,
      orçados: formData.orçados,
      meta_cnc: formData.meta_cnc,
      meta_card: formData.meta_card,
      meta_card_beneficio: formData.meta_card_beneficio,
      meta_consignado: formData.meta_consignado,
      meta_bmg_med: formData.meta_bmg_med,
      meta_seguro_familiar: formData.meta_seguro_familiar,
      meta_fgts: formData.meta_fgts,
    };

    let error;

    if (isEditing.value) {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token || null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await $fetch('/api/metas/update', { method: 'POST', headers, body: dataToSave });
        if (!res || res.success === false) throw new Error(res?.error || 'Erro ao atualizar meta');
      } catch (err) {
        error = err;
      }
    } else {
      try {
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token || null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await $fetch('/api/metas/create', { method: 'POST', headers, body: dataToSave });
        if (!res || res.success === false) throw new Error(res?.error || 'Erro ao criar meta');
      } catch (err) {
        error = err;
      }
    }

    if (error) {
      if (error.code === '23505') { // Código de violação de constraint única
        throw new Error('Já existe uma meta definida para esta loja neste período.');
      }
      throw error;
    }

    toast.add({ title: 'Sucesso!', description: `Meta ${isEditing.value ? 'atualizada' : 'criada'} com sucesso.` });
    isModalOpen.value = false;
    await refresh();
  } catch (err) {
    toast.add({ title: 'Erro!', description: err.message, color: 'red' });
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row) => {
  if (confirm(`Tem a certeza que quer apagar a meta da loja "${row.loja_nome}" para o período de ${selectedPeriod.value}?`)) {
    try {
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token || null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await $fetch('/api/metas/delete', { method: 'POST', headers, body: { id: row.id } });
  if (!res || res.success === false) throw new Error(res?.error || 'Erro ao apagar meta');
      toast.add({ title: 'Sucesso!', description: 'Meta apagada com sucesso.' });
      await refresh();
    } catch (err) {
      toast.add({ title: 'Erro!', description: err.message, color: 'red' });
    }
  }
};
</script>