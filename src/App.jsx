import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getEmpresa } from './tenant'
import Onboarding from './pages/Onboarding'
import Layout from './pages/Layout'
import Inicio from './pages/Inicio'
import Pessoas from './pages/Pessoas'
import Produtos from './pages/Produtos'
import Recebimento from './pages/Recebimento'
import Estoque from './pages/Estoque'

export default function App() {
  // Fonte de verdade da "sessao" provisoria: a empresa no localStorage.
  const [empresa, setEmpresa] = useState(getEmpresa())

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          empresa
            ? <Navigate to="/" replace />
            : <Onboarding aoConcluir={setEmpresa} />
        }
      />

      {empresa ? (
        <Route element={<Layout empresa={empresa} aoSair={() => setEmpresa(null)} />}>
          <Route path="/" element={<Inicio empresa={empresa} />} />
          <Route path="/pessoas" element={<Pessoas />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/recebimento" element={<Recebimento />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      )}
    </Routes>
  )
}
