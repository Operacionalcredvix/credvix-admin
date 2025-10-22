<template>
  <div class="w-80 p-4" role="dialog" aria-label="Selecionar período">
    <div class="space-y-3">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium" for="dp-range">Período</label>

        <!-- Container for Flatpickr if available, otherwise fallback inputs -->
        <div class="flex gap-2 items-center">
          <div class="flex-1">
            <input
              v-if="!flatpickrLoaded"
              id="dp-start"
              aria-label="Data de início"
              type="date"
              :value="toInputValue(localStart)"
              @input="onStartInput"
              class="w-full border rounded px-2 py-1"
              :min="toInputValue(minDate)"
            />

            <input
              v-if="!flatpickrLoaded"
              id="dp-end"
              aria-label="Data de término"
              type="date"
              :value="toInputValue(localEnd)"
              @input="onEndInput"
              class="w-full border rounded px-2 py-1 mt-2"
              :max="toInputValue(maxDate)"
            />

            <div v-if="flatpickrLoaded">
              <input ref="fpInput" id="dp-range" type="text" aria-label="Selecionar intervalo de datas" class="w-full border rounded px-2 py-1" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="text-sm font-medium">Atalhos</label>
        <div class="flex flex-wrap gap-2 mt-2">
          <button
            v-for="(p, i) in mergedPresets"
            :key="i"
            type="button"
            class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
            @click="applyPreset(p)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <UButton color="gray" variant="ghost" label="Fechar" @click="onClose" />
        <UButton color="primary" label="Aplicar" @click="onApply" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatISO, parseISO, startOfMonth, endOfMonth, subDays } from 'date-fns'

// Flatpickr types (loaded dynamically)
let Flatpickr: any = null
let flatpickrCSSInserted = false

interface Range { start: Date | string | null; end: Date | string | null }

const props = defineProps<{
  modelValue?: Range
  presets?: Array<{ label: string; start: Date; end: Date }>
  locale?: string
  minDate?: Date | string | null
  maxDate?: Date | string | null
  showApply?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'apply', 'close'])

const localStart = ref<Date | null>(null)
const localEnd = ref<Date | null>(null)

// Defaults
const defaultPresets = [
  { label: 'Mês Atual', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { label: 'Últimos 30 dias', start: subDays(new Date(), 30), end: new Date() },
  { label: 'Últimos 7 dias', start: subDays(new Date(), 7), end: new Date() }
]

const mergedPresets = computed(() => (props.presets && props.presets.length ? props.presets : defaultPresets))

// Inicializa local a partir do v-model
watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      localStart.value = defaultPresets[0].start
      localEnd.value = defaultPresets[0].end
      return
    }
    const s = v.start ? (typeof v.start === 'string' ? parseISO(v.start) : v.start) : null
    const e = v.end ? (typeof v.end === 'string' ? parseISO(v.end) : v.end) : null
    localStart.value = s
    localEnd.value = e
  },
  { immediate: true }
)

const toInputValue = (d?: Date | string | null) => {
  if (!d) return ''
  const date = typeof d === 'string' ? parseISO(d) : d
  try {
    return formatISO(date, { representation: 'date' })
  } catch (e) {
    return ''
  }
}

const parseInput = (v: string) => (v ? parseISO(v) : null)

const onStartInput = (e: Event) => {
  const v = (e.target as HTMLInputElement)?.value
  localStart.value = v ? parseInput(v) : null
}
const onEndInput = (e: Event) => {
  const v = (e.target as HTMLInputElement)?.value
  localEnd.value = v ? parseInput(v) : null
}

const fpInput = ref<HTMLInputElement | null>(null)
const flatpickrLoaded = ref(false)
let fpInstance: any = null

onMounted(async () => {
  // carrega flatpickr somente no cliente
  if (process.server) return
  try {
    Flatpickr = (await import('flatpickr')).default
    // injeta css do flatpickr se ainda não foi adicionado
    if (!flatpickrCSSInserted) {
      await import('flatpickr/dist/flatpickr.min.css')
      flatpickrCSSInserted = true
    }

    flatpickrLoaded.value = true
    // inicializa instância
    fpInstance = Flatpickr(fpInput.value as HTMLInputElement, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      defaultDate: [toInputValue(localStart.value), toInputValue(localEnd.value)].filter(Boolean),
      onClose: function(selectedDates: Date[]) {
        if (selectedDates && selectedDates.length >= 1) {
          localStart.value = selectedDates[0] || localStart.value
          localEnd.value = selectedDates[1] || localEnd.value
        }
      }
    })
  } catch (e) {
    // falha em carregar flatpickr: fallback para inputs nativos
    flatpickrLoaded.value = false
    console.warn('Flatpickr não pôde ser carregado, usando fallback nativo', e)
  }
})

onBeforeUnmount(() => {
  if (fpInstance && fpInstance.destroy) fpInstance.destroy()
})

const applyPreset = (p: { label: string; start: Date; end: Date }) => {
  localStart.value = p.start
  localEnd.value = p.end
  emit('update:modelValue', { start: p.start, end: p.end })
  emit('apply', { start: p.start, end: p.end })
}

const onApply = () => {
  // Normaliza: garante que start <= end
  if (localStart.value && localEnd.value && localStart.value > localEnd.value) {
    // troca
    const tmp = localStart.value
    localStart.value = localEnd.value
    localEnd.value = tmp
  }
  emit('update:modelValue', { start: localStart.value, end: localEnd.value })
  emit('apply', { start: localStart.value, end: localEnd.value })
}

const onClose = () => {
  emit('close')
}
</script>

<style scoped>
/* estilos básicos do flatpickr e do datepicker */
.flatpickr-calendar { z-index: 9000; }
/* Estilos mínimos para o datepicker */
</style>
