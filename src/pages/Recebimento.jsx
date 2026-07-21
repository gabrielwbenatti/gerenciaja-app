import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { getEmpresa } from '../tenant'
import { Campo, Alerta, PaginaTopo } from '../ui'
import Combobox from '../components/Combobox'

const hoje = () => new Date().toISOString().slice(0, 10)

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const num = (v) => (v === '' || v == null ? 0 : Number(v))
const arred2 = (v) => Math.round(v * 100) / 100

const itemVazio = () => ({
  produtoId: '', quantidadeDeclarada: '', quantidadeRecebida: '',
  valorUnitario: '', loteCodigo: '', dataValidade: '',
})
const dupVazia = () => ({ numero: '', vencimento: '', valor: '' })

export default function Recebimento() {
  const empresa = getEmpresa()
  const [fornecedores, setFornecedores] = useState(null)
  const [produtos, setProdutos] = useState(null)
  const [erroCarga, setErroCarga] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/pessoas?papel=FORNECEDOR'), api.get('/produtos')])
      .then(([f, p]) => { setFornecedores(f); setProdutos(p) })
      .catch((e) => setErroCarga(e.message))
  }, [])

  if (erroCarga) return <div className="card"><Alerta tipo="erro">{erroCarga}</Alerta></div>
  if (!fornecedores || !produtos) return <div className="carregando">Carregando…</div>

  return (
    <>
      <PaginaTopo titulo="Entrada de mercadoria"
                  descricao="Escrituração de NF-e: estoque, custo e contas a pagar em uma operação" />
      {fornecedores.length === 0 && (
        <Alerta tipo="erro">Cadastre ao menos um fornecedor em “Pessoas” antes de dar entrada.</Alerta>
      )}
      {produtos.length === 0 && (
        <Alerta tipo="erro">Cadastre ao menos um produto antes de dar entrada.</Alerta>
      )}
      <FormRecebimento empresa={empresa} fornecedores={fornecedores} produtos={produtos} />
    </>
  )
}

function FormRecebimento({ empresa, fornecedores, produtos }) {
  const produtoPorId = useMemo(
    () => Object.fromEntries(produtos.map((p) => [String(p.id), p])), [produtos])

  const [fornecedorId, setFornecedorId] = useState('')
  const [nota, setNota] = useState({
    serie: '', numero: '', dataEmissao: hoje(), dataEntrada: hoje(),
    naturezaOperacao: 'Compra para revenda', valorFrete: '', valorDesconto: '', valorTotal: '',
  })
  const [itens, setItens] = useState([itemVazio()])
  const [duplicatas, setDuplicatas] = useState([dupVazia()])
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  // Chave estavel por formulario: reenviar a mesma nota nao duplica a entrada.
  const [chaveIdem] = useState(() => 'web-' + crypto.randomUUID())

  const setN = (campo) => (e) => setNota({ ...nota, [campo]: e.target.value })

  // -- itens ---------------------------------------------------------------
  function setItem(i, campo, valor) {
    setItens((arr) => arr.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)))
  }
  const totalItem = (it) => arred2(num(it.quantidadeDeclarada) * num(it.valorUnitario))

  // -- totais ---------------------------------------------------------------
  const somaItens = arred2(itens.reduce((s, it) => s + totalItem(it), 0))
  const totalSugerido = arred2(somaItens + num(nota.valorFrete) - num(nota.valorDesconto))
  const somaDuplicatas = arred2(duplicatas.reduce((s, d) => s + num(d.valor), 0))
  const totalNota = num(nota.valorTotal)
  // Bonificacao/desconto: as duplicatas (o que se paga) podem somar MENOS que o
  // total da nota. So nao podem passar do total. A diferenca fica visivel.
  const naoCobrado = arred2(totalNota - somaDuplicatas)
  const duplicatasValidas = totalNota > 0 && somaDuplicatas <= arred2(totalNota)

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setResultado(null)

    if (!fornecedorId) return setErro('Selecione o fornecedor.')
    if (itens.some((it) => !it.produtoId)) return setErro('Todo item precisa de um produto selecionado.')
    for (const it of itens) {
      const prod = produtoPorId[it.produtoId]
      if (prod?.controlaLote && !it.loteCodigo.trim()) {
        return setErro(`O produto ${prod.sku} controla lote — informe o código do lote.`)
      }
    }
    if (!duplicatasValidas) {
      return setErro(`As duplicatas somam ${brl(somaDuplicatas)} e não podem passar do total da nota (${brl(totalNota)}).`)
    }

    const comando = {
      fornecedorId: Number(fornecedorId),
      depositoId: empresa.depositoPadraoId,
      chaveIdempotencia: chaveIdem,
      nota: {
        modelo: '55', serie: nota.serie, numero: nota.numero,
        dataEmissao: nota.dataEmissao, dataEntrada: nota.dataEntrada,
        naturezaOperacao: nota.naturezaOperacao,
        valorFrete: num(nota.valorFrete), valorSeguro: 0, valorOutrasDespesas: 0,
        valorDesconto: num(nota.valorDesconto), valorTotal: num(nota.valorTotal),
      },
      itens: itens.map((it) => ({
        produtoId: Number(it.produtoId),
        quantidadeDeclarada: num(it.quantidadeDeclarada),
        quantidadeRecebida: num(it.quantidadeRecebida),
        valorUnitario: num(it.valorUnitario),
        valorTotal: totalItem(it),
        loteCodigo: it.loteCodigo || null,
        dataValidade: it.dataValidade || null,
      })),
      duplicatas: duplicatas.map((d) => ({
        numero: d.numero, vencimento: d.vencimento, valor: num(d.valor),
      })),
    }

    setEnviando(true)
    try {
      setResultado(await api.post('/recebimentos', comando))
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return (
      <div className="card">
        <div className="resultado-ok">
          <h3>{resultado.jaEscriturada ? 'Nota já escriturada (reenvio)' : 'Entrada registrada com sucesso'}</h3>
          <div className="linha-res"><span className="rot">Nota fiscal</span> #{resultado.notaFiscalEntradaId}</div>
          <div className="linha-res"><span className="rot">Recebimento</span> #{resultado.recebimentoId}</div>
          <div className="linha-res"><span className="rot">Contas a pagar</span> {resultado.contasPagarIds.join(', ') || '—'}</div>
          <div className="linha-res"><span className="rot">Movimentos de estoque</span> {resultado.movimentosEstoqueIds.join(', ') || '—'}</div>
          {resultado.comDivergencia && (
            <div className="linha-res"><span className="aviso-diverg">⚠ Há divergência entre o declarado e o recebido — registrada como ocorrência.</span></div>
          )}
        </div>
        <button className="btn" onClick={() => window.location.reload()}>Nova entrada</button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar}>
      <Alerta tipo="erro">{erro}</Alerta>

      <div className="card">
        <h2>Nota fiscal</h2>
        <div className="form-grid">
          <Campo label="Fornecedor" req full ajuda="Busque por nome ou CNPJ/CPF">
            <Combobox
              items={fornecedores}
              value={fornecedorId}
              onChange={setFornecedorId}
              getId={(f) => f.id}
              getPrimary={(f) => f.nome}
              getSecondary={(f) => f.documento + (f.nomeFantasia ? ' · ' + f.nomeFantasia : '')}
              termos={(f) => [f.nome, f.nomeFantasia, f.documento].filter(Boolean).join(' ')}
              placeholder="Buscar fornecedor…"
            />
          </Campo>
          <Campo label="Série" req><input value={nota.serie} onChange={setN('serie')} required /></Campo>
          <Campo label="Número" req><input value={nota.numero} onChange={setN('numero')} required /></Campo>
          <Campo label="Data de emissão" req>
            <input type="date" value={nota.dataEmissao} onChange={setN('dataEmissao')} required />
          </Campo>
          <Campo label="Data de entrada" req>
            <input type="date" value={nota.dataEntrada} onChange={setN('dataEntrada')} required />
          </Campo>
          <Campo label="Frete">
            <input type="number" step="0.01" min="0" value={nota.valorFrete} onChange={setN('valorFrete')} />
          </Campo>
          <Campo label="Desconto">
            <input type="number" step="0.01" min="0" value={nota.valorDesconto} onChange={setN('valorDesconto')} />
          </Campo>
        </div>
      </div>

      <div className="card">
        <h2>Itens</h2>
        {itens.map((it, i) => {
          const prod = produtoPorId[it.produtoId]
          const controla = prod?.controlaLote
          return (
            <div key={i} className="linha-item"
                 style={{ gridTemplateColumns: controla ? '2fr 1fr 1fr 1fr 1.2fr 1.2fr auto' : '2fr 1fr 1fr 1fr auto' }}>
              <Campo label="Produto">
                <Combobox
                  items={produtos}
                  value={it.produtoId}
                  onChange={(id) => setItem(i, 'produtoId', id)}
                  getId={(p) => p.id}
                  getPrimary={(p) => `${p.sku} — ${p.nome}`}
                  getSecondary={(p) => p.controlaLote ? 'controla lote' : p.unidadeMedida}
                  termos={(p) => [p.sku, p.nome, p.codigoBarras].filter(Boolean).join(' ')}
                  placeholder="Buscar produto…"
                />
              </Campo>
              <Campo label="Qtd. nota">
                <input type="number" step="0.001" min="0" value={it.quantidadeDeclarada}
                       onChange={(e) => {
                         setItem(i, 'quantidadeDeclarada', e.target.value)
                         if (it.quantidadeRecebida === '' || it.quantidadeRecebida === it.quantidadeDeclarada) {
                           setItem(i, 'quantidadeRecebida', e.target.value)
                         }
                       }} />
              </Campo>
              <Campo label="Qtd. recebida">
                <input type="number" step="0.001" min="0" value={it.quantidadeRecebida}
                       onChange={(e) => setItem(i, 'quantidadeRecebida', e.target.value)} />
              </Campo>
              <Campo label="Vlr. unit.">
                <input type="number" step="0.01" min="0" value={it.valorUnitario}
                       onChange={(e) => setItem(i, 'valorUnitario', e.target.value)} />
              </Campo>
              {controla && (
                <Campo label="Lote">
                  <input value={it.loteCodigo} onChange={(e) => setItem(i, 'loteCodigo', e.target.value)} />
                </Campo>
              )}
              {controla && (
                <Campo label="Validade">
                  <input type="date" value={it.dataValidade} onChange={(e) => setItem(i, 'dataValidade', e.target.value)} />
                </Campo>
              )}
              <button type="button" className="linha-remover" title="Remover"
                      onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))}
                      disabled={itens.length === 1}>✕</button>
            </div>
          )
        })}
        <button type="button" className="add-linha" onClick={() => setItens((a) => [...a, itemVazio()])}>
          + Adicionar item
        </button>
      </div>

      <div className="card">
        <h2>Total e pagamento</h2>
        <div className="totais">
          <div className="item"><div className="rot">Soma dos itens</div><div className="val">{brl(somaItens)}</div></div>
          <div className="item"><div className="rot">+ Frete − Desconto</div><div className="val">{brl(totalSugerido)}</div></div>
          <div className="item">
            <div className="rot">Total da nota</div>
            <div className="val">
              <input type="number" step="0.01" min="0" style={{ width: 130 }}
                     value={nota.valorTotal} onChange={setN('valorTotal')} required />
              <button type="button" className="add-linha" style={{ marginLeft: 8 }}
                      onClick={() => setNota({ ...nota, valorTotal: String(totalSugerido) })}>
                usar {brl(totalSugerido)}
              </button>
            </div>
          </div>
        </div>

        <div className="secao-titulo">Duplicatas (parcelas a pagar)</div>
        {duplicatas.map((d, i) => (
          <div key={i} className="linha-item" style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
            <Campo label="Número">
              <input value={d.numero}
                     onChange={(e) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, numero: e.target.value } : x))} />
            </Campo>
            <Campo label="Vencimento">
              <input type="date" value={d.vencimento}
                     onChange={(e) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, vencimento: e.target.value } : x))} />
            </Campo>
            <Campo label="Valor">
              <input type="number" step="0.01" min="0" value={d.valor}
                     onChange={(e) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, valor: e.target.value } : x))} />
            </Campo>
            <button type="button" className="linha-remover"
                    onClick={() => setDuplicatas((a) => a.filter((_, idx) => idx !== i))}
                    disabled={duplicatas.length === 1}>✕</button>
          </div>
        ))}
        <button type="button" className="add-linha" onClick={() => setDuplicatas((a) => [...a, dupVazia()])}>
          + Adicionar parcela
        </button>

        <div className="totais" style={{ marginTop: 16 }}>
          <div className="item"><div className="rot">Soma das parcelas</div><div className="val">{brl(somaDuplicatas)}</div></div>
          <div className="item">
            <div className="rot">Não cobrado (bonificação/desconto)</div>
            <div className="val">{brl(naoCobrado)}</div>
          </div>
          <div className="item">
            <div className="rot">Situação</div>
            <div className={'val ' + (duplicatasValidas ? 'ok' : 'nok')}>
              {!duplicatasValidas
                ? '✗ parcelas passam do total'
                : naoCobrado > 0 ? '✓ com bonificação/desconto' : '✓ ok'}
            </div>
          </div>
        </div>
      </div>

      <div className="acoes-form">
        <button className="btn" disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar entrada'}
        </button>
      </div>
    </form>
  )
}
