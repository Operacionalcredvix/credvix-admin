import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  runtimeConfig: {
    // Chaves privadas que só estão disponíveis no lado do servidor
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // Chaves públicas, disponíveis em ambos os lados
    public: {
      supabase: {
        url: process.env.SUPABASE_DATABASE_URL,
        key: process.env.PUBLIC_SUPABASE_ANON_KEY,
        redirect: false,
        clientOptions: {
          auth: {
            // Garante que a sessão seja armazenada no sessionStorage.
            // A sessão será encerrada quando o navegador/aba for fechado.
            persistSession: true
          }
        }
      }
    }
  },

  css: ['@/assets/css/main.css'],
})