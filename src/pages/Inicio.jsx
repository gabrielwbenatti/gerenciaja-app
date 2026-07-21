import { PaginaTopo } from '../ui'

export default function Inicio({ empresa }) {
  const regimeLabel = {
    SIMPLES_NACIONAL: 'Simples Nacional',
    LUCRO_PRESUMIDO: 'Lucro Presumido',
    LUCRO_REAL: 'Lucro Real',
  }[empresa?.regimeTributario] || empresa?.regimeTributario

  return (
    <>
      <PaginaTopo titulo="Início" descricao="Visão geral da empresa" />
      <div className="card">
        <h2>{empresa?.razaoSocial}</h2>
        <div className="form-grid">
          <div><div className="rotulo" style={{ color: 'var(--muted)', fontSize: 12 }}>CNPJ</div>{empresa?.cnpj}</div>
          <div><div className="rotulo" style={{ color: 'var(--muted)', fontSize: 12 }}>Regime</div>{regimeLabel}</div>
          <div><div className="rotulo" style={{ color: 'var(--muted)', fontSize: 12 }}>Depósito padrão</div>#{empresa?.depositoPadraoId}</div>
        </div>
      </div>
      <div className="card">
        <h2>Como está o sistema</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Já funcionam: cadastro de <strong>pessoas</strong> (clientes e fornecedores)
          e de <strong>produtos</strong> (com e sem controle de lote). A entrada de
          mercadoria por nota fiscal existe na API e será exposta aqui em breve.
        </p>
      </div>
    </>
  )
}
