// POST /api/comunicados/upload-imagem
// Faz upload de imagem para o Supabase Storage

import { eventHandler, readMultipartFormData, createError } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default eventHandler(async (event) => {
  const admin = await serverSupabaseServiceRole(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Não autenticado'
    })
  }

  // Verifica permissão
  const { data: funcionario, error: funcError } = await admin
    .from('funcionarios')
    .select('id, perfil_id, perfis!inner(nome)')
    .eq('user_id', user.id) // user_id é UUID, não id
    .single()

  if (funcError || !funcionario) {
    console.error('Erro ao buscar funcionário:', funcError)
    throw createError({
      statusCode: 404,
      message: 'Funcionário não encontrado'
    })
  }

  const perfisAutorizados = ['Master', 'RH', 'Financeiro', 'Administrativo']
  const perfilNome = (funcionario.perfis as any)?.nome
  
  if (!perfisAutorizados.includes(perfilNome)) {
    throw createError({
      statusCode: 403,
      message: 'Sem permissão para fazer upload de imagens'
    })
  }

  // Lê o arquivo do form
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Nenhum arquivo enviado'
    })
  }

  const file = formData[0]

  if (!file.filename || !file.data) {
    throw createError({
      statusCode: 400,
      message: 'Arquivo inválido'
    })
  }

  // Valida tipo de arquivo
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      message: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WEBP'
    })
  }

  // Valida tamanho (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: 'Arquivo muito grande. Tamanho máximo: 5MB'
    })
  }

  // Gera nome único para o arquivo
  const timestamp = Date.now()
  const extension = file.filename.split('.').pop()
  const filename = `comunicados/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

  // Faz upload para o Supabase Storage
  const { data: uploadData, error: uploadError } = await admin.storage
    .from('public-files') // Nome do bucket (você pode mudar)
    .upload(filename, file.data, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Erro ao fazer upload:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Erro ao fazer upload da imagem'
    })
  }

  // Pega URL pública
  const { data: urlData } = admin.storage
    .from('public-files')
    .getPublicUrl(filename)

  return {
    success: true,
    url: urlData.publicUrl,
    filename: filename
  }
})
