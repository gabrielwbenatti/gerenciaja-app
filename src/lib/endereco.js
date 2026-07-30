// Regras do bloco de endereço, sem JSX.
//
// O endereço é opcional no sistema, mas quando vem preenchido a API exige
// logradouro, cidade e UF (ver EnderecoEntrada no backend). Daí o par
// enderecoPreenchido/faltaNoEndereco: sem checar aqui, um endereço meio
// digitado volta como 400 de validação genérico e o usuário não descobre qual
// campo faltou.

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const ENDERECO_INICIAL = {
  cep: '', logradouro: '', numero: '', complemento: '',
  bairro: '', cidade: '', uf: '', codigoIbge: '',
}

export function mascararCep(valor) {
  const d = (valor ?? '').replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

/** Preenche o bloco a partir do que a API devolveu (PessoaResposta.enderecos). */
export function enderecoDaResposta(enderecos, tipo = 'PRINCIPAL') {
  const e = (enderecos ?? []).find((x) => x.tipo === tipo)
  if (!e) return { ...ENDERECO_INICIAL }
  return {
    cep: mascararCep(e.cep ?? ''),
    logradouro: e.logradouro ?? '',
    numero: e.numero ?? '',
    complemento: e.complemento ?? '',
    bairro: e.bairro ?? '',
    cidade: e.cidade ?? '',
    uf: e.uf ?? '',
    codigoIbge: e.codigoIbge ?? '',
  }
}

export function enderecoPreenchido(v) {
  return Object.keys(ENDERECO_INICIAL).some((k) => (v[k] ?? '').toString().trim())
}

/** Mensagem do que falta, ou null quando está vazio (válido) ou completo. */
export function faltaNoEndereco(v) {
  if (!enderecoPreenchido(v)) return null
  const faltando = []
  if (!v.logradouro?.trim()) faltando.push('logradouro')
  if (!v.cidade?.trim()) faltando.push('cidade')
  if ((v.uf ?? '').trim().length !== 2) faltando.push('UF')
  return faltando.length
    ? `Endereço incompleto — informe ${faltando.join(', ')} (ou apague o bloco inteiro).`
    : null
}

/** Corpo para a API, ou null quando nada foi preenchido. */
export function enderecoParaApi(v, tipo = 'PRINCIPAL') {
  if (!enderecoPreenchido(v)) return null
  return {
    tipo,
    logradouro: v.logradouro.trim(),
    numero: v.numero?.trim() || null,
    complemento: v.complemento?.trim() || null,
    bairro: v.bairro?.trim() || null,
    cidade: v.cidade.trim(),
    uf: v.uf.trim().toUpperCase(),
    cep: v.cep?.trim() || null,
    codigoIbge: v.codigoIbge?.trim() || null,
  }
}
