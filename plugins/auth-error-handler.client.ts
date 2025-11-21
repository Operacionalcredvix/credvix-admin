export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const router = useRouter()

  // Monitora erros de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      // Redireciona para login apenas se não estiver já na página de login
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
  })
})
