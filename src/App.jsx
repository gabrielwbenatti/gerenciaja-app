import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getSessao } from './sessao'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Layout from './pages/Layout'
import Inicio from './pages/Inicio'
import Pessoas from './pages/Pessoas'
import Produtos from './pages/Produtos'
import Recebimento from './pages/Recebimento'
import Vendas from './pages/Vendas'
import VendaEditar from './pages/VendaEditar'
import Estoque from './pages/Estoque'
import Extrato from './pages/Extrato'
import NotasEntrada from './pages/NotasEntrada'
import NotaEntradaDetalhe from './pages/NotaEntradaDetalhe'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  // Fonte de verdade da sessao: o token guardado no localStorage. Sem ele, tudo
  // cai no login -- e o servidor recusa de qualquer forma, entao esta checagem e
  // so para nao mostrar tela quebrada.
  const [sessao, setSessao] = useState(getSessao())

  return (
    <Routes>
      <Route
        path="/login"
        element={sessao ? <Navigate to="/" replace /> : <Login aoEntrar={setSessao} />}
      />
      <Route
        path="/onboarding"
        element={sessao ? <Navigate to="/" replace /> : <Onboarding aoConcluir={setSessao} />}
      />

      {sessao ? (
        <Route element={<Layout sessao={sessao} aoSair={() => setSessao(null)} />}>
          <Route path="/" element={<Inicio empresa={sessao.empresa} />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/recebimento" element={<Recebimento />} />
          <Route path="/notas" element={<NotasEntrada />} />
          <Route path="/notas/:id" element={<NotaEntradaDetalhe />} />
          <Route path="/vendas" element={<Vendas />} />
          {/* "novo" antes de ":id": o react-router prefere o segmento estático,
              mas deixar explícito evita que /vendas/novo caia no detalhe. */}
          <Route path="/vendas/novo" element={<VendaEditar />} />
          <Route path="/vendas/:id" element={<VendaEditar />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/estoque/:produtoId" element={<Extrato />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}
