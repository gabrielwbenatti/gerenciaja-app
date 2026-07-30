// Cliente HTTP unico. Manda o token da sessao em toda chamada, exceto nas duas
// publicas (login e cadastro de empresa), que sao justamente as que criam a
// sessao.
//
// O X-Tenant-Id sumiu: o tenant agora e uma claim assinada dentro do token, e
// nao mais um header que o front escolhe -- que era o buraco que deixava
// qualquer cliente ler dados de outra empresa.

import { getToken, limparSessao } from './sessao'

const BASE = '/api'

class ApiError extends Error {
  constructor(status, corpo) {
    super(corpo?.mensagem || corpo?.error || `Erro ${status}`)
    this.status = status
    this.corpo = corpo
  }
}

async function request(method, path, { body, publico = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (!publico) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const resp = await fetch(BASE + path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  // 401 numa rota protegida = token expirado, adulterado ou ausente. Limpa e
  // manda para o login.
  //
  // A rota publica fica de fora porque o 401 dela e outra coisa: e "senha
  // errada", e precisa chegar na tela como mensagem em vez de virar um
  // redirecionamento que engole o erro.
  if (resp.status === 401 && !publico) {
    limparSessao()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new ApiError(401, { mensagem: 'Sessão expirada. Entre novamente.' })
  }

  if (resp.status === 204) return null

  const texto = await resp.text()
  const dados = texto ? JSON.parse(texto) : null

  if (!resp.ok) throw new ApiError(resp.status, dados)
  return dados
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),

  // -- publicas: sem token, sao elas que devolvem um --
  login: (body) => request('POST', '/auth/login', { body, publico: true }),
  cadastrarEmpresa: (body) => request('POST', '/empresas', { body, publico: true }),

  /** Revalida o token guardado e devolve a sessao atualizada. */
  sessao: () => request('GET', '/auth/sessao'),
}

export { ApiError }
