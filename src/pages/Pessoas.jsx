import { useEffect, useState } from 'react'
import { api } from '../api'
import { Campo, Alerta, PaginaTopo } from '../ui'

const PAPEIS = ['CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA', 'VENDEDOR']

const FORM_VAZIO = {
  tipo: 'PJ', documento: '', nome: '', nomeFantasia: '',
  papeis: ['CLIENTE'], email: '', telefone: '',
}

export default function Pessoas() {
  const [lista, setLista] = useState(null)
  const [erroLista, setErroLista] = useState(null)
  const [criando, setCriando] = useState(false)

  async function carregar() {
    setErroLista(null)
    try {
      setLista(await api.get('/pessoas'))
    } catch (err) {
      setErroLista(err.message)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <>
      <PaginaTopo titulo="Pessoas" descricao="Clientes, fornecedores e demais contatos">
        <button className="btn" onClick={() => setCriando(true)}>Nova pessoa</button>
      </PaginaTopo>

      {criando && (
        <FormPessoa
          aoSalvar={() => { setCriando(false); carregar() }}
          aoCancelar={() => setCriando(false)}
        />
      )}

      <div className="card">
        <Alerta tipo="erro">{erroLista}</Alerta>
        {lista === null && !erroLista && <div className="carregando">Carregando…</div>}
        {lista && lista.length === 0 && <div className="vazio">Nenhuma pessoa cadastrada ainda.</div>}
        {lista && lista.length > 0 && (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th><th>Tipo</th><th>Documento</th><th>Papéis</th><th>Contato</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}{p.nomeFantasia && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{p.nomeFantasia}</div>}</td>
                    <td>{p.tipo}</td>
                    <td>{p.documento}</td>
                    <td>{p.papeis.map((pp) => <span key={pp} className="tag">{pp}</span>)}</td>
                    <td>{p.email || p.telefone || '—'}</td>
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

function FormPessoa({ aoSalvar, aoCancelar }) {
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  // Detecta PF/PJ pelo documento enquanto digita: 11 = CPF (PF), 14 = CNPJ (PJ).
  // Abaixo de 11 mantem o tipo atual, para nao ficar trocando a cada tecla.
  // O seletor manual continua funcionando e sobrepoe quando o usuario escolhe.
  function onDocumento(e) {
    const valor = e.target.value
    const qtd = valor.replace(/[^A-Za-z0-9]/g, '').length
    setForm((f) => ({
      ...f,
      documento: valor,
      tipo: qtd >= 12 ? 'PJ' : qtd === 11 ? 'PF' : f.tipo,
    }))
  }

  function togglePapel(papel) {
    setForm((f) => ({
      ...f,
      papeis: f.papeis.includes(papel)
        ? f.papeis.filter((x) => x !== papel)
        : [...f.papeis, papel],
    }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    if (form.papeis.length === 0) { setErro('Selecione ao menos um papel.'); return }
    setEnviando(true)
    try {
      const corpo = { ...form }
      if (!corpo.email) delete corpo.email
      await api.post('/pessoas', corpo)
      aoSalvar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="card">
      <h2>Nova pessoa</h2>
      <Alerta tipo="erro">{erro}</Alerta>
      <form onSubmit={enviar}>
        <div className="form-grid">
          <Campo label="CPF / CNPJ" req
                 ajuda="Digite o documento — o tipo se ajusta sozinho">
            <input value={form.documento} onChange={onDocumento}
                   placeholder="CPF (11 dígitos) ou CNPJ (14)" required autoFocus />
          </Campo>
          <Campo label="Tipo" ajuda="Detectado pelo documento; pode ajustar manualmente">
            <select value={form.tipo} onChange={set('tipo')}>
              <option value="PJ">Pessoa Jurídica</option>
              <option value="PF">Pessoa Física</option>
            </select>
          </Campo>
          <Campo label="Nome / Razão social" req full>
            <input value={form.nome} onChange={set('nome')} required />
          </Campo>
          <Campo label="Nome fantasia">
            <input value={form.nomeFantasia} onChange={set('nomeFantasia')} />
          </Campo>
          <Campo label="E-mail">
            <input type="email" value={form.email} onChange={set('email')} />
          </Campo>
          <Campo label="Telefone">
            <input value={form.telefone} onChange={set('telefone')} />
          </Campo>
          <Campo label="Papéis" req full ajuda="Uma pessoa pode ter mais de um">
            <div className="chips">
              {PAPEIS.map((p) => (
                <span key={p}
                      className={'chip' + (form.papeis.includes(p) ? ' sel' : '')}
                      onClick={() => togglePapel(p)}>
                  {p}
                </span>
              ))}
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
