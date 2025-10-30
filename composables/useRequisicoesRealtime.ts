// composables/useRequisicoesRealtime.ts
// @ts-nocheck
export function useRequisicoesRealtime() {
  const supabase = useSupabaseClient()
  let channel: ReturnType<typeof supabase.channel> | null = null

  function subscribe(onChange: (payload: any) => void) {
    if (channel) return () => unsubscribe()
    channel = supabase.channel('requisicoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requisicoes' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requisicoes_comentarios' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requisicoes_historico' }, onChange)
      .subscribe((status) => {
        // optional: console.log('Realtime status', status)
      })
    return () => unsubscribe()
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return { subscribe, unsubscribe }
}
