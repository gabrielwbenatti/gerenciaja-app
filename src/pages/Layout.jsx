import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { limparEmpresa } from '../tenant'

export default function Layout({ empresa, aoSair }) {
  const navigate = useNavigate()

  function sair() {
    limparEmpresa()
    aoSair?.()
    navigate('/onboarding')
  }

  const link = ({ isActive }) => (isActive ? 'ativo' : undefined)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Gerencie<span>Já</span></div>
        <nav className="nav">
          <NavLink to="/" end className={link}>Início</NavLink>
          <NavLink to="/pessoas" className={link}>Pessoas</NavLink>
          <NavLink to="/produtos" className={link}>Produtos</NavLink>
          <NavLink to="/recebimento" className={link}>Entrada de mercadoria</NavLink>
          <NavLink to="/notas" className={link}>Notas de entrada</NavLink>
          <NavLink to="/estoque" className={link}>Estoque</NavLink>
        </nav>
        <div className="empresa-box">
          <div className="rotulo">Empresa</div>
          <div className="nome">{empresa?.nomeFantasia || empresa?.razaoSocial}</div>
          <button onClick={sair}>Trocar empresa</button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  )
}
