// Formatação de CPF/CNPJ — mesmo padrão do projeto lavixx.
//
// Guardamos o documento limpo (só alfanumérico) no backend; aqui cuidamos da
// máscara na digitação (maskDocument) e da formatação na exibição
// (formatDocument). O CNPJ pode ser alfanumérico (12 alfanuméricos + 2 dígitos),
// por isso os grupos aceitam qualquer caractere, não só \d.

/** Só alfanuméricos, maiúsculo. É a forma como o documento é comparado/gravado. */
export function limparDocumento(valor) {
  return (valor ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/**
 * Normaliza texto para BUSCA: sem acento, minúsculo, e sem os separadores de
 * documento (. - /). Assim "60575" acha "60.575..." e "joao" acha "João".
 * Mantém espaços e letras para continuar casando por nome.
 */
export function normalizeBusca(s) {
  return (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.\-/]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Máscara progressiva para input: reformata a cada tecla a partir do que já foi
 * digitado (sem exigir o tamanho final). CPF (000.000.000-00) até 11 caracteres;
 * reflui para CNPJ (00.000.000/0000-00) ao passar de 11.
 */
export function maskDocument(raw) {
  const clean = limparDocumento(raw).slice(0, 14)
  const len = clean.length

  if (len <= 11) {
    if (len > 9) return clean.replace(/(.{3})(.{3})(.{3})(.{1,2})/, '$1.$2.$3-$4')
    if (len > 6) return clean.replace(/(.{3})(.{3})(.{1,3})/, '$1.$2.$3')
    if (len > 3) return clean.replace(/(.{3})(.{1,3})/, '$1.$2')
    return clean
  }

  if (len > 12) return clean.replace(/(.{2})(.{3})(.{3})(.{4})(.{1,2})/, '$1.$2.$3/$4-$5')
  if (len > 8) return clean.replace(/(.{2})(.{3})(.{3})(.{1,4})/, '$1.$2.$3/$4')
  return clean.replace(/(.{2})(.{3})(.{1,3})/, '$1.$2.$3')
}

/**
 * Formata para exibição. CPF (11) → 000.000.000-00; CNPJ (14) → 00.000.000/0000-00.
 * Fora desses tamanhos, devolve como está.
 */
export function formatDocument(doc) {
  if (!doc) return '—'
  const d = limparDocumento(doc)
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (d.length === 14) return d.replace(/(.{2})(.{3})(.{3})(.{4})(.{2})/, '$1.$2.$3/$4-$5')
  return doc
}
