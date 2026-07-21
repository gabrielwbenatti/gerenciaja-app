// Componentes de UI reaproveitados pelas telas.

export function Campo({ label, req, ajuda, full, children }) {
  return (
    <div className={'campo' + (full ? ' full' : '')}>
      <label>{label} {req && <span className="req">*</span>}</label>
      {children}
      {ajuda && <span className="ajuda">{ajuda}</span>}
    </div>
  )
}

export function Alerta({ tipo, children }) {
  if (!children) return null
  return <div className={'alerta ' + tipo}>{children}</div>
}

export function PaginaTopo({ titulo, descricao, children }) {
  return (
    <div className="pagina-topo">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {children}
    </div>
  )
}
