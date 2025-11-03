export function isMasterPerfil(nome?: string | null) {
  if (!nome) return false;
  const masters = ['Master', 'Diretoria', 'Gerência', 'Gerente'];
  return masters.includes(nome);
}

export function isMasterOr(nome?: string | null, extra?: string[]) {
  if (isMasterPerfil(nome)) return true;
  if (!nome || !extra) return false;
  return extra.includes(nome);
}

// helper to normalize profile names (optional)
export function normalizePerfilNome(nome?: string | null) {
  if (!nome) return '';
  return nome.trim();
}
