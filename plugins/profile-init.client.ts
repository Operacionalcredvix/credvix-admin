// Este plugin roda apenas no cliente para evitar problemas de SSR
export default defineNuxtPlugin(() => {
  // Plugin vazio - apenas garante que useProfile seja chamado no cliente
  // O composable já tem sua própria lógica de inicialização
})
