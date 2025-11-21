<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
    <UpdateNotification />
    
    <!-- Modal de Comunicados -->
    <ComunicadoModal
      v-if="comunicadoAtual && mostrarModal"
      v-model="mostrarModal"
      :comunicado="comunicadoAtual"
      :total="comunicadosNaoVistos.length"
      :indice-atual="0"
      @confirmar="handleConfirmarLeitura"
    />
  </div>
</template>

<script setup>
const { startAutoCheck } = useVersionCheck()
const { 
  comunicadosNaoVistos, 
  mostrarModal, 
  comunicadoAtual, 
  marcarComoVisualizado,
  iniciarVerificacaoAutomatica 
} = useComunicados()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Limpa tokens inválidos e inicia verificação automática
onMounted(async () => {
  try {
    // Tenta obter a sessão atual
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Se houver erro de refresh token, limpa tudo
    if (error && error.message.includes('Refresh Token')) {
      console.log('Limpando tokens inválidos...')
      await supabase.auth.signOut({ scope: 'local' })
      
      // Limpa localStorage manualmente
      if (process.client) {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
    }
  } catch (e) {
    console.error('Erro ao verificar sessão:', e)
  }
  
  startAutoCheck(2) // Verifica atualizações a cada 2 minutos
  
  // Inicia verificação de comunicados se estiver autenticado
  if (user.value) {
    iniciarVerificacaoAutomatica(5) // Verifica comunicados a cada 5 minutos
  }
})

// Observa mudanças no usuário para iniciar verificação (apenas se estiver iniciando sessão)
watch(user, (newUser, oldUser) => {
  // Apenas inicia se passou de não autenticado para autenticado
  if (newUser && !oldUser) {
    iniciarVerificacaoAutomatica(5)
  }
})

// Handler para confirmar leitura
const handleConfirmarLeitura = async () => {
  if (comunicadoAtual.value) {
    await marcarComoVisualizado(comunicadoAtual.value.id)
  }
}
</script>