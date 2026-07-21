import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { Alerta, PaginaTopo } from '../ui'

const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// origem_tipo -> rótulo legível
function origem(tipo, id) {
  if (!tipo) return '—'
  const rotulos = { NF_ENTRADA: 'NF entrada', VENDA: 'Venda', AJUSTE: 'Ajuste', TRANSFERENCIA: 'Transferência' }
  return `${rotulos[tipo] || tipo}${id ? ' #' + id : ''}`
}

// Cada tipo de movimento tem uma cor de sinal
const TIPO_LABEL = {
  COMPRA: 'Compra', VENDA: 'Venda', AJUSTE: 'Ajuste',
  DEVOLUCAO_CLIENTE: 'Devol. cliente', DEVOLUCAO_FORNECEDOR: 'Devol. fornecedor',
  TRANSFERENCIA: 'Transferência', PERDA: 'Perda', ESTORNO: 'Estorno',
}

export default function Extrato() {
  const { produtoId } = useParams()
  const [produto, setProduto] = useState(null)
  const [linhas, setLinhas] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setErro(null)
    Promise.all([
      api.get(`/produtos/${produtoId}`),
      api.get(`/estoque/produtos/${produtoId}/extrato`),
    ])
      .then(([p, ext]) => { setProduto(p); setLinhas(ext) })
      .catch((e) => setErro(e.message))
  }, [produtoId])

  const saldoAtual = linhas && linhas.length > 0 ? linhas[linhas.length - 1].saldoAcumulado : 0

  return (
    <>
      <PaginaTopo
        titulo={produto ? `Extrato — ${produto.nome}` : 'Extrato'}
        descricao={produto ? `SKU ${produto.sku} · saldo atual ${qtd(saldoAtual)} ${produto.unidadeMedida}` : ''}>
        <Link to="/estoque" className="btn btn-secundario">← Voltar ao estoque</Link>
      </PaginaTopo>

      <div className="card">
        <Alerta tipo="erro">{erro}</Alerta>
        {linhas === null && !erro && <div className="carregando">Carregando…</div>}
        {linhas && linhas.length === 0 && (
          <div className="vazio">Nenhum movimento — este produto ainda não teve entradas nem saídas.</div>
        )}
        {linhas && linhas.length > 0 && (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th><th>Tipo</th><th>Lote</th><th>Depósito</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Custo unit.</th>
                  <th>Origem</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((m, i) => {
                  const entrada = Number(m.quantidade) >= 0
                  return (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{dataHora(m.dataMovimento)}</td>
                      <td>{TIPO_LABEL[m.tipo] || m.tipo}</td>
                      <td>{m.loteCodigo === 'SINTETICO'
                        ? <span style={{ color: 'var(--muted)' }}>—</span>
                        : m.loteCodigo}</td>
                      <td>{m.depositoNome}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: entrada ? 'var(--success)' : 'var(--danger)' }}>
                        {entrada ? '+' : ''}{qtd(m.quantidade)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{brl(m.custoUnitario)}</td>
                      <td>{origem(m.origemTipo, m.origemId)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{qtd(m.saldoAcumulado)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
