import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Alerta, PaginaTopo } from '../ui'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

export function statusNota(status) {
  const cores = {
    ESCRITURADA: { color: 'var(--success)', borderColor: '#bbf7d0' },
    DIGITADA: { color: 'var(--muted)' },
    CONFERIDA: { color: 'var(--primary)', borderColor: '#bfdbfe' },
    CANCELADA: { color: 'var(--danger)', borderColor: '#fecaca' },
  }
  const label = { ESCRITURADA: 'Escriturada', DIGITADA: 'Digitada', CONFERIDA: 'Conferida', CANCELADA: 'Cancelada' }
  return <span className="tag" style={cores[status] || {}}>{label[status] || status}</span>
}

export default function NotasEntrada() {
  const navigate = useNavigate()
  const [notas, setNotas] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/notas-entrada').then(setNotas).catch((e) => setErro(e.message))
  }, [])

  return (
    <>
      <PaginaTopo titulo="Notas de entrada" descricao="Notas fiscais de compra lançadas" />
      <div className="card">
        <Alerta tipo="erro">{erro}</Alerta>
        {notas === null && !erro && <div className="carregando">Carregando…</div>}
        {notas && notas.length === 0 && (
          <div className="vazio">Nenhuma nota lançada. Use “Entrada de mercadoria” para lançar a primeira.</div>
        )}
        {notas && notas.length > 0 && (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nº / Série</th><th>Fornecedor</th>
                  <th>Emissão</th><th>Entrada</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Situação</th><th></th>
                </tr>
              </thead>
              <tbody>
                {notas.map((n) => (
                  <tr key={n.id} style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/notas/${n.id}`)} title="Ver detalhes">
                    <td>{n.numero}<span style={{ color: 'var(--muted)' }}> / {n.serie}</span></td>
                    <td>{n.fornecedor}</td>
                    <td>{data(n.dataEmissao)}</td>
                    <td>{data(n.dataEntrada)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{brl(n.valorTotal)}</td>
                    <td>{statusNota(n.status)}</td>
                    <td><span className="btn-linha">Detalhes →</span></td>
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
