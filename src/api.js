// Cliente HTTP unico. Injeta o X-Tenant-Id (provisorio -- ver TenantFilter no
// backend) em toda chamada, exceto no cadastro de empresa, que roda sem tenant.

import { getTenantId } from './tenant'

const BASE = '/api'

class ApiError extends Error {
  constructor(status, corpo) {
    super(corpo?.mensagem || corpo?.error || `Erro ${status}`)
    this.status = status
    this.corpo = corpo
  }
}

async function request(method, path, { body, semTenant = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (!semTenant) {
    const tenant = getTenantId()
    if (tenant) headers['X-Tenant-Id'] = tenant
  }

  const resp = await fetch(BASE + path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

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

  // Cadastro de empresa: unico fluxo sem tenant (e ele que cria o tenant).
  cadastrarEmpresa: (body) => request('POST', '/empresas', { body, semTenant: true }),
}

export { ApiError }
