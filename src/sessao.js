// Estado da sessao no navegador.
//
// Substitui o antigo tenant.js, que guardava so a empresa. Agora o que manda e
// o token: o tenant deixou de ser algo que o front escolhe e passou a ser uma
// claim assinada dentro dele. A empresa continua guardada porque as telas
// precisam do depositoPadraoId e do nome sem ir ao servidor a cada render.
//
// localStorage e nao sessionStorage de proposito: fechar a aba nao deve
// deslogar. Quem controla a duracao e a expiracao do token.

const CHAVE = 'gerencieja.sessao'

export function getSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    // JSON corrompido por versao antiga do app: tratar como deslogado em vez
    // de estourar em toda tela que le a sessao.
    return null
  }
}

export function setSessao(sessao) {
  localStorage.setItem(CHAVE, JSON.stringify(sessao))
}

export function limparSessao() {
  localStorage.removeItem(CHAVE)
}

export function getToken() {
  return getSessao()?.token ?? null
}

export function getEmpresa() {
  return getSessao()?.empresa ?? null
}

export function getUsuario() {
  return getSessao()?.usuario ?? null
}

/** Atualiza so a empresa, preservando token e usuario (ex.: apos mudar config). */
export function atualizarEmpresa(empresa) {
  const sessao = getSessao()
  if (!sessao) return
  setSessao({ ...sessao, empresa })
}
