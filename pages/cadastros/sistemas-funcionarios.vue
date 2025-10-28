<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Sistemas por Funcionário</h1>
        <p class="text-gray-500">Gerencie os sistemas de terceiros utilizados por cada funcionário.</p>
      </div>
      <div class="flex gap-2">
        <UButton icon="i-heroicons-arrow-path" :loading="carregando" @click="recarregar">Atualizar</UButton>
        <UButton color="primary" icon="i-heroicons-check" :disabled="!funcionarioSelecionado" :loading="salvando" @click="salvar">Salvar</UButton>
      </div>
    </div>

    <UCard>
      <UFormGroup label="Selecionar Funcionário">
        <USelectMenu
          v-model="funcionarioSelecionado"
          :options="funcionariosOptions"
          searchable
          searchable-placeholder="Digite o nome ou email para buscar..."
          :loading="carregandoFuncionarios"
          value-attribute="id"
          option-attribute="label"
          placeholder="Busque e selecione um funcionário"
          @update:model-value="carregarSistemasFuncionario"
        >
          <template #label>
            <span v-if="funcionarioSelecionado">
              {{ funcionariosOptions.find(f => f.id === funcionarioSelecionado)?.label }}
            </span>
          </template>
        </USelectMenu>
      </UFormGroup>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Sistemas do Funcionário</h3>
          <div class="flex gap-2">
            <USelectMenu
              v-model="sistemaSelecionado"
              :options="sistemasOptions"
              value-attribute="nome"
              option-attribute="nome"
              placeholder="Adicionar sistema existente"
              @change="adicionarSistemaSelecionado"
            />
            <UInput v-model="novoSistema" placeholder="Novo sistema (Enter para adicionar)" @keyup.enter="adicionarNovoSistema" />
          </div>
        </div>
      </template>

      <div class="flex flex-wrap gap-2 min-h-[44px]">
        <template v-if="sistemasFuncionario.length">
          <UBadge
            v-for="(s, idx) in sistemasFuncionario"
            :key="`${s}-${idx}`"
            color="blue"
            variant="soft"
            size="lg"
            class="gap-1"
          >
            <UIcon name="i-heroicons-tag" />
            {{ s }}
            <UButton icon="i-heroicons-x-mark" color="red" variant="ghost" size="xs" @click="removerSistema(s)" />
          </UBadge>
        </template>
        <p v-else class="text-gray-500">Nenhum sistema atribuído ainda.</p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="text-lg font-medium">Sugestões de Sistemas Populares</h3>
      </template>
      <div class="flex flex-wrap gap-2">
        <UButton v-for="s in sistemasPopulares" :key="s.nome" size="xs" color="gray" variant="soft" @click="adicionarSistemaPorNome(s.nome)">
          {{ s.nome }}
        </UButton>
        <p v-if="!sistemasPopulares.length" class="text-gray-500">Nenhuma sugestão disponível ainda.</p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const toast = useAppToast()

const carregando = ref(false)
const salvando = ref(false)

// Funcionários
const carregandoFuncionarios = ref(false)
const funcionariosOptions = ref([])
const funcionarioSelecionado = ref(null)

// Sistemas
const sistemasOptions = ref([]) // [{ id, nome }]
const sistemasPopulares = ref([]) // [{ id, nome, usos }]
const sistemasFuncionario = ref<string[]>([])
const sistemaSelecionado = ref(null)
const novoSistema = ref('')

onMounted(() => {
  buscarFuncionarios()
  carregarSistemas()
  carregarSistemasPopulares()
})

async function buscarFuncionarios() {
  try {
    carregandoFuncionarios.value = true
    const { data, error } = await supabase
      .from('funcionarios')
      .select('id, nome_completo, email')
      .order('nome_completo', { ascending: true })
      .limit(200)

    if (error) throw error

    funcionariosOptions.value = (data || []).map(f => ({
      id: f.id,
      label: `${f.nome_completo} - ${f.email}`
    }))
  } catch (e) {
    console.error(e)
    toast.error('Erro ao buscar funcionários')
  } finally {
    carregandoFuncionarios.value = false
  }
}

async function carregarSistemas() {
  try {
    const { data, error } = await supabase.rpc('listar_todos_sistemas')
    if (error) throw error
    sistemasOptions.value = data || []
  } catch (e) {
    console.error(e)
  }
}

async function carregarSistemasPopulares() {
  try {
    const { data, error } = await supabase.rpc('listar_sistemas_populares', { p_limit: 12 })
    if (error) throw error
    sistemasPopulares.value = (data && data.length ? data : (sistemasOptions.value || []).slice(0, 12))
  } catch (e) {
    console.error(e)
    sistemasPopulares.value = (sistemasOptions.value || []).slice(0, 12)
  }
}

async function carregarSistemasFuncionario() {
  if (!funcionarioSelecionado.value) return
  try {
    carregando.value = true
    const { data, error } = await supabase.rpc('listar_sistemas_funcionario', {
      p_funcionario_id: funcionarioSelecionado.value
    })
    if (error) throw error
    sistemasFuncionario.value = (data || []).map(s => s.nome)
  } catch (e) {
    console.error(e)
    toast.error('Erro ao carregar sistemas do funcionário')
  } finally {
    carregando.value = false
  }
}

function adicionarSistemaSelecionado() {
  if (!sistemaSelecionado.value) return
  adicionarSistemaPorNome(sistemaSelecionado.value)
  sistemaSelecionado.value = null
}

function adicionarNovoSistema() {
  const nome = (novoSistema.value || '').trim()
  if (!nome) return
  adicionarSistemaPorNome(nome)
  novoSistema.value = ''
}

function adicionarSistemaPorNome(nome: string) {
  if (!nome) return
  if (!sistemasFuncionario.value.includes(nome)) {
    sistemasFuncionario.value.push(nome)
  }
}

function removerSistema(nome: string) {
  sistemasFuncionario.value = sistemasFuncionario.value.filter(s => s !== nome)
}

async function salvar() {
  if (!funcionarioSelecionado.value) return
  try {
    salvando.value = true
    const { error } = await supabase.rpc('set_sistemas_funcionario', {
      p_funcionario_id: funcionarioSelecionado.value,
      p_sistemas: sistemasFuncionario.value
    })
    if (error) throw error
    toast.success('Sistemas atualizados com sucesso')
    carregarSistemasFuncionario()
    carregarSistemas()
  } catch (e) {
    console.error(e)
    toast.error('Erro ao salvar sistemas')
  } finally {
    salvando.value = false
  }
}

function recarregar() {
  buscarFuncionarios()
  carregarSistemas()
  carregarSistemasPopulares()
  carregarSistemasFuncionario()
}
</script>
