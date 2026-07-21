import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Alerta, PaginaTopo } from '../ui'

const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)

export default function Estoque() {
  const navigate = useNavigate()
  const [saldos, setSaldos] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/estoque/saldos').then(setSaldos).catch((e) => setErro(e.message))
  }, [])

  return (
    <>
      <PaginaTopo titulo="Estoque" descricao="Saldo consolidado por produto (todos os lotes e depósitos)" />
      <div className="card">
        <Alerta tipo="erro">{erro}</Alerta>
        {saldos === null && !erro && <div className="carregando">Carregando…</div>}
        {saldos && saldos.length === 0 && <div className="vazio">Nenhum produto cadastrado ainda.</div>}
        {saldos && saldos.length > 0 && (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th><th>Produto</th><th>Un.</th>
                  <th style={{ textAlign: 'right' }}>Em mãos</th>
                  <th style={{ textAlign: 'right' }}>Reservado</th>
                  <th style={{ textAlign: 'right' }}>Disponível</th>
                  <th style={{ textAlign: 'right' }}>Mínimo</th>
                  <th>Situação</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((s) => {
                  const disponivel = Number(s.quantidade) - Number(s.reservada)
                  const abaixoMinimo = Number(s.quantidade) < Number(s.estoqueMinimo)
                  const zerado = Number(s.quantidade) <= 0
                  return (
                    <tr key={s.produtoId} style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/estoque/${s.produtoId}`)}
                        title="Ver extrato">
                      <td>{s.sku}</td>
                      <td>{s.nome}</td>
                      <td>{s.unidade}</td>
                      <td style={{ textAlign: 'right' }}>{qtd(s.quantidade)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{qtd(s.reservada)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{qtd(disponivel)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }}>{qtd(s.estoqueMinimo)}</td>
                      <td>{situacao(zerado, abaixoMinimo)}</td>
                      <td><span className="btn-linha">Extrato →</span></td>
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

function situacao(zerado, abaixoMinimo) {
  if (zerado) return <span className="tag" style={{ color: 'var(--danger)', borderColor: '#fecaca' }}>Zerado</span>
  if (abaixoMinimo) return <span className="tag" style={{ color: '#b45309', borderColor: '#fde68a' }}>Abaixo do mínimo</span>
  return <span className="tag" style={{ color: 'var(--success)', borderColor: '#bbf7d0' }}>OK</span>
}
