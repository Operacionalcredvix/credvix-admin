<template>
  <div>
    <header class="mb-8">
      <h1 class="text-primary-500 text-3xl font-bold">Desempenho Individual</h1>
      <p class="text-gray-500 mt-1">Acompanhe o desempenho de cada consultor em relação às suas metas individuais.</p>
    </header>

    <!-- Cards de KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UIcon name="i-heroicons-users" class="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Consultores</p>
            <p class="text-2xl font-bold">{{ kpis.totalConsultores }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <UIcon name="i-heroicons-chart-bar" class="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Média Geral</p>
            <p class="text-2xl font-bold" :class="getColorClass(kpis.mediaAtingimento)">{{ kpis.mediaAtingimento }}%</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <UIcon name="i-heroicons-trophy" class="text-2xl text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Top Performers</p>
            <p class="text-2xl font-bold text-green-600">{{ kpis.topPerformers }} <span class="text-sm text-gray-500">({{ kpis.topPerformersPercent }}%)</span></p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Abaixo de 75%</p>
            <p class="text-2xl font-bold text-red-600">{{ kpis.underPerformers }} <span class="text-sm text-gray-500">({{ kpis.underPerformersPercent }}%)</span></p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filtros -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-funnel" class="text-primary-500" />
          <h3 class="font-semibold">Filtros</h3>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormGroup label="Período" name="period">
          <UInput type="month" v-model="selectedPeriod" />
        </UFormGroup>

        <UFormGroup label="Loja" name="store">
          <USelectMenu 
            v-model="selectedLoja" 
            :options="lojas" 
            value-attribute="id" 
            option-attribute="nome" 
            placeholder="Todas as Lojas" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Regional" name="regional">
          <USelectMenu 
            v-model="selectedRegional" 
            :options="regionais" 
            value-attribute="id" 
            option-attribute="nome_regional" 
            placeholder="Todas as Regionais" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Performance" name="performance">
          <USelectMenu 
            v-model="selectedPerformance" 
            :options="performanceOptions" 
            value-attribute="value"
            option-attribute="label"
            placeholder="Todos os níveis" 
            clearable 
          />
        </UFormGroup>

        <UFormGroup label="Buscar Consultor" name="search" class="lg:col-span-2">
          <UInput 
            v-model="selectedConsultant" 
            icon="i-heroicons-magnifying-glass"
            placeholder="Digite o nome do consultor..." 
            clearable 
          />
        </UFormGroup>
      </div>

      <div class="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton @click="clearFilters" variant="ghost" icon="i-heroicons-x-mark" color="gray">
          Limpar Filtros
        </UButton>
      </div>
    </UCard>

    <!-- Tabela de Desempenho -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Desempenho dos Consultores</h3>
          <UButton icon="i-heroicons-arrow-down-tray" size="sm" color="gray" variant="ghost" @click="exportToExcel">
            Exportar Excel
          </UButton>
        </div>
      </template>

      <UTable :rows="desempenhoFiltrado" :columns="columns" :loading="pending">
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-12 gap-3">
            <UIcon name="i-heroicons-users" class="text-6xl text-gray-400" />
            <p class="text-gray-500">Nenhum consultor encontrado para este período</p>
            <p class="text-sm text-gray-400">Tente selecionar outro mês ou ajustar os filtros</p>
          </div>
        </template>

        <template #rank-data="{ row }">
          <div class="flex items-center gap-2">
            <UBadge v-if="row.rank <= 3" :color="getRankBadgeColor(row.rank)" variant="solid">
              {{ row.rank }}º
            </UBadge>
            <span v-else class="text-gray-500 font-semibold">{{ row.rank }}º</span>
            <UIcon v-if="row.rank === 1" name="i-heroicons-trophy" class="text-amber-500" />
          </div>
        </template>

        <template #consultor_nome-data="{ row }">
          <div class="flex items-center gap-3">
            <div>
              <p class="font-bold">{{ row.consultor_nome }}</p>
              <p class="text-xs text-gray-500">{{ row.loja_nome }}</p>
            </div>
          </div>
        </template>

        <template #multi_volume-data="{ row }">
          <div class="text-center">
            <p class="font-bold text-lg" :class="getColorClass(row.percentual_multi_volume)">
              {{ formatCurrency(row.atingido_multi_volume) }}
            </p>
            <p class="text-xs text-gray-500">de {{ formatCurrency(row.meta_multi_volume) }}</p>
            <div class="flex items-center gap-2 mt-1 justify-center">
              <UProgress :value="row.percentual_multi_volume" :color="getProgressColor(row.percentual_multi_volume)" size="sm" class="w-20" />
              <span class="text-xs font-semibold" :class="getColorClass(row.percentual_multi_volume)">
                {{ row.percentual_multi_volume.toFixed(1) }}%
              </span>
            </div>
          </div>
        </template>

        <template #desempenho_cnc-data="{ row }">
          <PerformanceCell :atingido="row.atingido_cnc" :meta="row.meta_individual_cnc" type="currency" />
        </template>
        <template #desempenho_card-data="{ row }">
          <PerformanceCell :atingido="row.atingido_card" :meta="row.meta_individual_card" type="currency" />
        </template>
        <template #desempenho_card_beneficio-data="{ row }">
          <PerformanceCell :atingido="row.atingido_card_beneficio" :meta="row.meta_individual_card_beneficio" type="currency" />
        </template>
        <template #desempenho_consignado-data="{ row }">
          <PerformanceCell :atingido="row.atingido_consignado" :meta="row.meta_individual_consignado" type="currency" />
        </template>
        <template #desempenho_fgts-data="{ row }">
          <PerformanceCell :atingido="row.atingido_fgts" :meta="row.meta_individual_fgts" type="currency" />
        </template>
        <template #desempenho_bmg_med-data="{ row }">
          <PerformanceCell :atingido="row.atingido_bmg_med" :meta="row.meta_individual_bmg_med" type="integer" />
        </template>
        <template #desempenho_seguro_familiar-data="{ row }">
          <PerformanceCell :atingido="row.atingido_seguro_familiar" :meta="row.meta_individual_seguro_familiar" type="integer" />
        </template>
        <template #actions-data="{ row }">
          <UButton icon="i-heroicons-eye" size="xs" color="gray" variant="ghost" @click="openDetails(row)">
            Detalhes
          </UButton>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup>
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const supabase = useSupabaseClient()
const { profile } = useProfile()

// Estado
const selectedPeriod = ref(format(new Date(), 'yyyy-MM'))
const selectedLoja = ref(null)
const selectedRegional = ref(null)
const selectedPerformance = ref(null)
const selectedConsultant = ref(null)
const detailsModalOpen = ref(false)
const selectedConsultorData = ref(null)

// Opções
const performanceOptions = [
  { label: 'Acima da Meta (≥100%)', value: 'above' },
  { label: 'Na Meta (75-99%)', value: 'ontrack' },
  { label: 'Abaixo da Meta (<75%)', value: 'below' }
]

// Colunas da tabela
const columns = [
  { key: 'rank', label: 'Rank' },
  { key: 'consultor_nome', label: 'Consultor' },
  { key: 'multi_volume', label: 'Multi-Volume Total', sortable: true },
  { key: 'desempenho_cnc', label: 'CNC' },
  { key: 'desempenho_card', label: 'Card' },
  { key: 'desempenho_card_beneficio', label: 'Card Benefício' },
  { key: 'desempenho_consignado', label: 'Consignado' },
  { key: 'desempenho_fgts', label: 'FGTS' },
  { key: 'desempenho_bmg_med', label: 'BMG Med' },
  { key: 'desempenho_seguro_familiar', label: 'Seguro Familiar' },
  { key: 'actions', label: '' }
]

// Carregar Lojas
const { data: lojas } = await useAsyncData('lojas-filtro-individual', async () => {
  let query = supabase.from('lojas').select('id, nome, regional_id').order('nome')

  if (profile.value?.perfil === 'Coordenador' && profile.value?.regional_id) {
    query = query.eq('regional_id', profile.value.regional_id)
  } else if (profile.value?.perfil === 'Supervisor' && profile.value?.loja_id) {
    query = query.eq('id', profile.value.loja_id)
  }

  const { data, error } = await query
  if (error) {
    console.error('Erro ao carregar lojas:', error)
    return []
  }
  return data
})

// Carregar Regionais
const { data: regionais } = await useAsyncData('regionais-filtro-individual', async () => {
  // Supervisor não tem acesso a filtro de regional
  if (profile.value?.perfil === 'Supervisor') {
    return []
  }
  
  // Coordenador vê apenas sua regional
  if (profile.value?.perfil === 'Coordenador' && profile.value?.regional_id) {
    const { data, error } = await supabase
      .from('regionais')
      .select('id, nome_regional')
      .eq('id', profile.value.regional_id)
    
    if (error) {
      console.error('Erro ao carregar regional:', error)
      return []
    }
    return data || []
  }
  
  // Master vê todas as regionais
  const { data, error } = await supabase
    .from('regionais')
    .select('id, nome_regional')
    .order('nome_regional')
  
  if (error) {
    console.error('Erro ao carregar regionais:', error)
    return []
  }
  return data || []
})

// Carregar Desempenho
const { data: desempenho, pending, refresh } = await useAsyncData(
  'desempenho-individual',
  async () => {
    // Converter YYYY-MM para primeiro dia do mês (formato DATE)
    const periodo = `${selectedPeriod.value}-01`

    // Query otimizada: buscar diretamente funcionários consultores ativos
    // e fazer LEFT JOIN com os dados de desempenho
    let query = supabase.rpc('get_desempenho_consultores_month', {
      p_periodo: periodo,
      p_loja_id: selectedLoja.value,
      p_regional_id: selectedRegional.value
    })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar desempenho:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Fallback: tentar query simplificada sem RPC
      console.log('Tentando query alternativa...')
      
      let fallbackQuery = supabase
        .from('funcionarios')
        .select(`
          id,
          nome_completo,
          loja_id,
          lojas!inner(nome, regional_id, regionais(nome_regional))
        `)
        .eq('is_active', true)
        .in('perfil_id', supabase
          .from('perfis')
          .select('id')
          .eq('nome', 'Consultor')
        )

      // Aplicar filtros de escopo
      if (profile.value?.perfil === 'Supervisor' && profile.value?.loja_id) {
        fallbackQuery = fallbackQuery.eq('loja_id', profile.value.loja_id)
      } else if (profile.value?.perfil === 'Coordenador' && profile.value?.regional_id) {
        fallbackQuery = fallbackQuery.eq('lojas.regional_id', profile.value.regional_id)
      }

      // Aplicar filtros selecionados
      if (selectedLoja.value) {
        fallbackQuery = fallbackQuery.eq('loja_id', selectedLoja.value)
      }
      if (selectedRegional.value && !selectedLoja.value) {
        fallbackQuery = fallbackQuery.eq('lojas.regional_id', selectedRegional.value)
      }

      fallbackQuery = fallbackQuery.limit(100)

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        console.error('Erro na query alternativa:', fallbackError)
        return []
      }

      // Retornar consultores sem dados de desempenho (zeros)
      return (fallbackData || []).map((consultor, index) => ({
        consultor_id: consultor.id,
        consultor_nome: consultor.nome_completo,
        loja_id: consultor.loja_id,
        loja_nome: consultor.lojas.nome,
        regional_id: consultor.lojas.regional_id,
        nome_regional: consultor.lojas.regionais?.nome_regional,
        periodo,
        meta_individual_cnc: 0,
        meta_individual_card: 0,
        meta_individual_card_beneficio: 0,
        meta_individual_consignado: 0,
        meta_individual_fgts: 0,
        meta_individual_bmg_med: 0,
        meta_individual_seguro_familiar: 0,
        atingido_cnc: 0,
        atingido_card: 0,
        atingido_card_beneficio: 0,
        atingido_consignado: 0,
        atingido_fgts: 0,
        atingido_bmg_med: 0,
        atingido_seguro_familiar: 0,
        atingido_multi_volume: 0,
        meta_multi_volume: 0,
        percentual_multi_volume: 0,
        rank: index + 1
      }))
    }

    if (!data || data.length === 0) {
      return []
    }

    // Calcular multi-volume e percentual
    const dataWithVolume = data.map((row) => {
      const atingido_multi_volume = 
        (row.atingido_cnc || 0) +
        (row.atingido_card || 0) +
        (row.atingido_card_beneficio || 0) +
        (row.atingido_consignado || 0) +
        (row.atingido_fgts || 0)

      const meta_multi_volume = 
        (row.meta_individual_cnc || 0) +
        (row.meta_individual_card || 0) +
        (row.meta_individual_card_beneficio || 0) +
        (row.meta_individual_consignado || 0) +
        (row.meta_individual_fgts || 0)

      const percentual_multi_volume = meta_multi_volume > 0 
        ? (atingido_multi_volume / meta_multi_volume) * 100 
        : 0

      return {
        ...row,
        atingido_multi_volume,
        meta_multi_volume,
        percentual_multi_volume
      }
    })

    // Ordenar e adicionar ranking
    const sortedData = dataWithVolume.sort((a, b) => b.percentual_multi_volume - a.percentual_multi_volume)
    return sortedData.map((row, index) => ({
      ...row,
      rank: index + 1
    }))
  },
  {
    watch: [selectedPeriod, selectedLoja, selectedRegional]
  }
)

// Filtrar por desempenho e consultor
const desempenhoFiltrado = computed(() => {
  if (!desempenho.value) return []
  
  let filtered = desempenho.value

  // Filtro de performance
  if (selectedPerformance.value) {
    filtered = filtered.filter((row) => {
      const perc = row.percentual_multi_volume
      if (selectedPerformance.value === 'above') return perc >= 100
      if (selectedPerformance.value === 'ontrack') return perc >= 75 && perc < 100
      if (selectedPerformance.value === 'below') return perc < 75
      return true
    })
  }

  // Filtro de consultor (busca por nome)
  if (selectedConsultant.value && selectedConsultant.value.trim() !== '') {
    const search = selectedConsultant.value.toLowerCase()
    filtered = filtered.filter((row) => 
      row.consultor_nome?.toLowerCase().includes(search)
    )
  }

  return filtered
})

// KPIs computados
const kpis = computed(() => {
  if (!desempenho.value || desempenho.value.length === 0) {
    return {
      totalConsultores: 0,
      mediaAtingimento: 0,
      topPerformers: 0,
      topPerformersPercent: 0,
      underPerformers: 0,
      underPerformersPercent: 0
    }
  }

  const total = desempenho.value.length
  const somaPercentuais = desempenho.value.reduce((acc, row) => acc + row.percentual_multi_volume, 0)
  const media = somaPercentuais / total

  const acimaDaMeta = desempenho.value.filter((row) => row.percentual_multi_volume >= 100).length
  const abaixoDaMeta = desempenho.value.filter((row) => row.percentual_multi_volume < 75).length

  return {
    totalConsultores: total,
    mediaAtingimento: media.toFixed(1),
    topPerformers: acimaDaMeta,
    topPerformersPercent: ((acimaDaMeta / total) * 100).toFixed(1),
    underPerformers: abaixoDaMeta,
    underPerformersPercent: ((abaixoDaMeta / total) * 100).toFixed(1)
  }
})

// Funções
const clearFilters = () => {
  selectedLoja.value = null
  selectedRegional.value = null
  selectedPerformance.value = null
  selectedConsultant.value = null
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const getColorClass = (percentage) => {
  if (percentage >= 100) return 'text-green-600'
  if (percentage >= 75) return 'text-amber-600'
  return 'text-red-600'
}

const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'green'
  if (percentage >= 75) return 'amber'
  return 'red'
}

const getRankBadgeColor = (rank) => {
  if (rank === 1) return 'yellow'
  if (rank === 2) return 'gray'
  if (rank === 3) return 'orange'
  return 'gray'
}

const openDetails = (row) => {
  selectedConsultorData.value = row
  detailsModalOpen.value = true
}

const exportToExcel = () => {
  if (!desempenhoFiltrado.value || desempenhoFiltrado.value.length === 0) {
    alert('Não há dados para exportar')
    return
  }

  const exportData = desempenhoFiltrado.value.map((row) => ({
    'Rank': row.rank,
    'Consultor': row.consultor_nome,
    'Loja': row.loja_nome,
    'Regional': row.nome_regional,
    'Multi-Volume Atingido': row.atingido_multi_volume,
    'Multi-Volume Meta': row.meta_multi_volume,
    'Multi-Volume %': row.percentual_multi_volume.toFixed(2) + '%',
    'CNC Atingido': row.atingido_cnc || 0,
    'CNC Meta': row.meta_individual_cnc || 0,
    'Card Atingido': row.atingido_card || 0,
    'Card Meta': row.meta_individual_card || 0,
    'Card Benefício Atingido': row.atingido_card_beneficio || 0,
    'Card Benefício Meta': row.meta_individual_card_beneficio || 0,
    'Consignado Atingido': row.atingido_consignado || 0,
    'Consignado Meta': row.meta_individual_consignado || 0,
    'FGTS Atingido': row.atingido_fgts || 0,
    'FGTS Meta': row.meta_individual_fgts || 0,
    'BMG Med Atingido': row.atingido_bmg_med || 0,
    'BMG Med Meta': row.meta_individual_bmg_med || 0,
    'Seguro Familiar Atingido': row.atingido_seguro_familiar || 0,
    'Seguro Familiar Meta': row.meta_individual_seguro_familiar || 0
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Desempenho Individual')
  
  const filename = `desempenho_individual_${selectedPeriod.value}.xlsx`
  XLSX.writeFile(workbook, filename)
}
</script>