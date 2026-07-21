// Estado do tenant no navegador.
//
// PROVISORIO: enquanto nao ha login, a "sessao" e apenas o tenant guardado no
// localStorage. Trocar de empresa = limpar isto. Quando o JWT entrar, o tenant
// passa a vir do token e este arquivo vira uma leitura da sessao autenticada.

const CHAVE = 'gerencieja.empresa'

export function getEmpresa() {
  const bruto = localStorage.getItem(CHAVE)
  return bruto ? JSON.parse(bruto) : null
}

export function getTenantId() {
  return getEmpresa()?.id ?? null
}

export function setEmpresa(empresa) {
  localStorage.setItem(CHAVE, JSON.stringify(empresa))
}

export function limparEmpresa() {
  localStorage.removeItem(CHAVE)
}
