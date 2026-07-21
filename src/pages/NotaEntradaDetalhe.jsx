import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { Alerta, PaginaTopo } from '../ui'
import { statusNota } from './NotasEntrada'
import { formatDocument } from '../lib/format'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

function Campo({ rotulo, children }) {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{rotulo}</div>
      <div style={{ fontWeight: 500 }}>{children}</div>
    </div>
  )
}

export default function NotaEntradaDetalhe() {
  const { id } = useParams()
  const [nota, setNota] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setErro(null)
    api.get(`/notas-entrada/${id}`).then(setNota).catch((e) => setErro(e.message))
  }, [id])

  return (
    <>
      <PaginaTopo
        titulo={nota ? `Nota ${nota.numero} / ${nota.serie}` : 'Nota de entrada'}
        descricao={nota ? nota.fornecedor : ''}>
        <Link to="/notas" className="btn btn-secundario">← Voltar</Link>
      </PaginaTopo>

      <Alerta tipo="erro">{erro}</Alerta>
      {nota === null && !erro && <div className="carregando">Carregando…</div>}

      {nota && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Dados da nota</h2>
              {statusNota(nota.status)}
            </div>
            <div className="form-grid">
              <Campo rotulo="Fornecedor">{nota.fornecedor}</Campo>
              <Campo rotulo="Documento">{formatDocument(nota.fornecedorDocumento)}</Campo>
              <Campo rotulo="Modelo / Série / Número">{nota.modelo} · {nota.serie} · {nota.numero}</Campo>
              <Campo rotulo="Natureza da operação">{nota.naturezaOperacao || '—'}</Campo>
              <Campo rotulo="Emissão">{data(nota.dataEmissao)}</Campo>
              <Campo rotulo="Entrada">{data(nota.dataEntrada)}</Campo>
              <Campo rotulo="Chave de acesso">{nota.chaveAcesso || '—'}</Campo>
            </div>
          </div>

          <div className="card">
            <h2>Itens</h2>
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>SKU</th><th>Produto</th><th>Cód. fornecedor</th>
                    <th style={{ textAlign: 'right' }}>Qtd.</th>
                    <th style={{ textAlign: 'right' }}>Vlr. unit.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Custo aquis.</th>
                  </tr>
                </thead>
                <tbody>
                  {nota.itens.map((it) => (
                    <tr key={it.numero}>
                      <td>{it.numero}</td>
                      <td>{it.sku}</td>
                      <td>{it.produto}</td>
                      <td style={{ color: 'var(--muted)' }}>{it.codigoNoFornecedor || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{qtd(it.quantidade)} {it.unidade}</td>
                      <td style={{ textAlign: 'right' }}>{brl(it.valorUnitario)}</td>
                      <td style={{ textAlign: 'right' }}>{brl(it.valorTotal)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{brl(it.custoAquisicaoUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="totais" style={{ marginTop: 16 }}>
              <div className="item"><div className="rot">Produtos</div><div className="val">{brl(nota.valorProdutos)}</div></div>
              <div className="item"><div className="rot">Frete</div><div className="val">{brl(nota.valorFrete)}</div></div>
              <div className="item"><div className="rot">Desconto</div><div className="val">{brl(nota.valorDesconto)}</div></div>
              <div className="item"><div className="rot">Total da nota</div><div className="val" style={{ color: 'var(--primary)' }}>{brl(nota.valorTotal)}</div></div>
            </div>
          </div>

          <div className="card">
            <h2>Contas a pagar geradas</h2>
            {nota.contas.length === 0
              ? <div className="vazio">Sem parcelas (compra à vista ou totalmente bonificada).</div>
              : (
                <div className="tabela-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Duplicata</th><th>Parcela</th><th>Vencimento</th>
                        <th style={{ textAlign: 'right' }}>Valor</th>
                        <th style={{ textAlign: 'right' }}>Pago</th><th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nota.contas.map((c) => (
                        <tr key={c.id}>
                          <td>{c.numeroDuplicata || '—'}</td>
                          <td>{c.parcela}/{c.totalParcelas}</td>
                          <td>{data(c.vencimento)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{brl(c.valor)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{brl(c.valorPago)}</td>
                          <td><span className="tag">{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </>
      )}
    </>
  )
}
