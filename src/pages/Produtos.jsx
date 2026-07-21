import { useEffect, useState } from 'react'
import { api } from '../api'
import { Campo, Alerta, PaginaTopo } from '../ui'

const UNIDADES = ['UN', 'KG', 'G', 'CX', 'L', 'ML', 'M', 'M2', 'M3', 'PC']

const FORM_VAZIO = {
  sku: '', nome: '', codigoBarras: '', unidadeMedida: 'UN',
  precoVenda: '', estoqueMinimo: '', controlaLote: false,
  ncm: '',
}

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export default function Produtos() {
  const [lista, setLista] = useState(null)
  const [erroLista, setErroLista] = useState(null)
  const [criando, setCriando] = useState(false)

  async function carregar() {
    setErroLista(null)
    try {
      setLista(await api.get('/produtos'))
    } catch (err) {
      setErroLista(err.message)
    }
  }

  useEffect(() => { carregar() }, [])

  async function alternarSituacao(p) {
    try {
      await api.patch(`/produtos/${p.id}/situacao`, { ativo: !p.ativo })
      carregar()
    } catch (err) {
      setErroLista(err.message)
    }
  }

  return (
    <>
      <PaginaTopo titulo="Produtos" descricao="Catálogo de itens">
        <button className="btn" onClick={() => setCriando(true)}>Novo produto</button>
      </PaginaTopo>

      {criando && (
        <FormProduto
          aoSalvar={() => { setCriando(false); carregar() }}
          aoCancelar={() => setCriando(false)}
        />
      )}

      <div className="card">
        <Alerta tipo="erro">{erroLista}</Alerta>
        {lista === null && !erroLista && <div className="carregando">Carregando…</div>}
        {lista && lista.length === 0 && <div className="vazio">Nenhum produto cadastrado ainda.</div>}
        {lista && lista.length > 0 && (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th><th>Nome</th><th>Un.</th>
                  <th>Preço venda</th><th>Custo médio</th><th>Lote</th>
                  <th>Situação</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id} style={{ opacity: p.ativo ? 1 : 0.5 }}>
                    <td>{p.sku}</td>
                    <td>{p.nome}</td>
                    <td>{p.unidadeMedida}</td>
                    <td>{brl(p.precoVenda)}</td>
                    <td>{brl(p.custoMedio)}</td>
                    <td>{p.controlaLote
                      ? <span className="tag">Controla</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td>{p.ativo
                      ? <span className="tag" style={{ color: 'var(--success)', borderColor: '#bbf7d0' }}>Ativo</span>
                      : <span className="tag" style={{ color: 'var(--muted)' }}>Inativo</span>}</td>
                    <td>
                      <button className="btn-linha" onClick={() => alternarSituacao(p)}>
                        {p.ativo ? 'Inativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function FormProduto({ aoSalvar, aoCancelar }) {
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const corpo = {
        sku: form.sku,
        nome: form.nome,
        codigoBarras: form.codigoBarras || null,
        unidadeMedida: form.unidadeMedida,
        precoVenda: form.precoVenda === '' ? 0 : Number(form.precoVenda),
        estoqueMinimo: form.estoqueMinimo === '' ? 0 : Number(form.estoqueMinimo),
        controlaLote: form.controlaLote,
        dadosFiscais: form.ncm ? { ncm: form.ncm } : null,
      }
      await api.post('/produtos', corpo)
      aoSalvar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="card">
      <h2>Novo produto</h2>
      <Alerta tipo="erro">{erro}</Alerta>
      <form onSubmit={enviar}>
        <div className="form-grid">
          <Campo label="SKU" req>
            <input value={form.sku} onChange={set('sku')} placeholder="ARROZ-5KG" required />
          </Campo>
          <Campo label="Código de barras (EAN)">
            <input value={form.codigoBarras} onChange={set('codigoBarras')} />
          </Campo>
          <Campo label="Nome" req full>
            <input value={form.nome} onChange={set('nome')} required />
          </Campo>
          <Campo label="Unidade">
            <select value={form.unidadeMedida} onChange={set('unidadeMedida')}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Campo>
          <Campo label="NCM" ajuda="Opcional — usado na emissão de NF-e">
            <input value={form.ncm} onChange={set('ncm')} maxLength={8} />
          </Campo>
          <Campo label="Preço de venda">
            <input type="number" step="0.01" min="0" value={form.precoVenda} onChange={set('precoVenda')} />
          </Campo>
          <Campo label="Estoque mínimo">
            <input type="number" step="0.001" min="0" value={form.estoqueMinimo} onChange={set('estoqueMinimo')} />
          </Campo>
          <Campo label="Controle de lote" full
                 ajuda="Marque para produtos com validade (alimentos, cosméticos, medicamentos)">
            <div className="checkbox-linha">
              <input type="checkbox" checked={form.controlaLote}
                     onChange={(e) => setForm({ ...form, controlaLote: e.target.checked })} />
              <span>Este produto controla lote e validade</span>
            </div>
          </Campo>
        </div>
        <div className="acoes-form">
          <button className="btn" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" className="btn btn-secundario" onClick={aoCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
