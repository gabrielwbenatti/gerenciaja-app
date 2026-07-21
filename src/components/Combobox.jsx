import { useMemo, useState } from 'react'

// Normaliza para busca: sem acento, minusculo. Assim "Sao" acha "São".
const norm = (s) =>
  (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Campo de busca com lista filtrada, no estilo do VehicleSearch do lavixx.
 *
 * Genérico: o pai fornece os itens e como cada um vira texto de busca e rótulo.
 * Ao escolher, chama onChange(id). Digitar de novo limpa a seleção.
 *
 * @param items       array de objetos
 * @param value       id do item selecionado (ou '' / null)
 * @param onChange    (id) => void
 * @param getId       item => id
 * @param getPrimary  item => texto principal (linha de cima)
 * @param getSecondary item => texto secundário (linha de baixo)
 * @param termos      item => string com tudo que é pesquisável (sku, nome, doc…)
 */
export default function Combobox({
  items, value, onChange,
  getId, getPrimary, getSecondary, termos,
  placeholder = 'Digite para buscar…', autoFocus,
}) {
  const selecionado = items.find((it) => String(getId(it)) === String(value))
  const [query, setQuery] = useState('')
  const [editando, setEditando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [hl, setHl] = useState(0)

  // Enquanto não está digitando, mostra o rótulo do item selecionado.
  const textoInput = editando ? query : (selecionado ? getPrimary(selecionado) : '')

  const matches = useMemo(() => {
    const q = norm(query.trim())
    const base = q.length === 0
      ? items
      : items.filter((it) => norm(termos(it)).includes(q))
    return base.slice(0, 8)
  }, [query, items, termos])

  function escolher(it) {
    onChange(getId(it))
    setEditando(false)
    setAberto(false)
    // NAO fazer blur aqui: blur joga o foco para o body, e o proximo Tab
    // recomeca do topo da pagina. Mantendo o foco no input, Tab segue natural
    // para o proximo campo do formulario.
  }

  function aoDigitar(v) {
    setQuery(v)
    setEditando(true)
    setAberto(true)
    setHl(0)
    if (value) onChange('') // digitou de novo => limpa a selecao
  }

  function aoTeclar(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setAberto(true); setHl((h) => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setHl((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (aberto && matches[hl]) { e.preventDefault(); escolher(matches[hl]) }
    } else if (e.key === 'Escape') {
      setAberto(false)
    }
  }

  return (
    <div className="combo">
      <input
        type="text"
        value={textoInput}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        // required "virtual": um input escondido garante a validacao nativa
        onChange={(e) => aoDigitar(e.target.value)}
        onFocus={() => { setEditando(true); setQuery(''); setAberto(true) }}
        onBlur={() => setTimeout(() => { setAberto(false); setEditando(false) }, 120)}
        onKeyDown={aoTeclar}
      />

      {aberto && (
        <div className="combo-lista">
          {matches.length === 0
            ? <div className="combo-vazio">Nada encontrado.</div>
            : matches.map((it, i) => (
                <button
                  key={getId(it)}
                  type="button"
                  tabIndex={-1}
                  className={'combo-opcao' + (i === hl ? ' hl' : '')}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHl(i)}
                  onClick={() => escolher(it)}
                >
                  <span className="primary">{getPrimary(it)}</span>
                  {getSecondary(it) && <span className="secondary">{getSecondary(it)}</span>}
                </button>
              ))}
        </div>
      )}
    </div>
  )
}
