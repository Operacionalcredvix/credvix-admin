// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/supabase', '@nuxtjs/tailwindcss'],

supabase: {
    url: process.env.SUPABASE_URL as string,
    key: process.env.SUPABASE_ANON_KEY as string
  },

css: ['./assets/css/main.css'],

})