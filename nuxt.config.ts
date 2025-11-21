import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-11-19',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  vite: {
    optimizeDeps: {
      exclude: ['oxc-parser']
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separa node_modules em chunks menores para reduzir uso de memória
            if (id.includes('node_modules')) {
              if (id.includes('chart.js') || id.includes('vue-chartjs')) {
                return 'vendor-charts';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@nuxt') || id.includes('nuxt')) {
                return 'vendor-nuxt';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      hmr: {
        overlay: false
      }
    }
  },

  nitro: {
    experimental: {
      openAPI: false
    },
    externals: {
      inline: ['@supabase/supabase-js']
    }
  },

  runtimeConfig: {
    // Chaves privadas que só estão disponíveis no lado do servidor
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

    // Chaves públicas, disponíveis em ambos os lados
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY,
        redirect: false,
        clientOptions: {
          auth: {
            // Garante que a sessão seja armazenada no sessionStorage.
            // A sessão será encerrada quando o navegador/aba for fechado.
            persistSession: true
          },
          global: {
            headers: {
              'x-client-info': 'credvix-admin'
            }
          },
          db: {
            schema: 'public'
          }
        },
        redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/'],
    }
      }
    }
  },

  css: ['@/assets/css/main.css'],
})