#!/bin/bash

# Script de build para Vercel - evita erro do oxc-parser

echo "🔧 Limpando cache e dependências antigas..."
rm -rf node_modules
rm -rf .nuxt
rm -rf .output
rm -f package-lock.json

echo "📦 Instalando dependências sem opcional..."
npm install --legacy-peer-deps --no-optional --force

echo "🏗️ Rodando build do Nuxt..."
npm run build

echo "✅ Build concluído!"
