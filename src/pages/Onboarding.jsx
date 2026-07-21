import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { setEmpresa } from '../tenant'
import { Campo, Alerta } from '../ui'
import { maskDocument } from '../lib/format'

const REGIMES = [
  ['SIMPLES_NACIONAL', 'Simples Nacional'],
  ['LUCRO_PRESUMIDO', 'Lucro Presumido'],
  ['LUCRO_REAL', 'Lucro Real'],
]

export default function Onboarding({ aoConcluir }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
    regimeTributario: 'SIMPLES_NACIONAL',
  })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const empresa = await api.cadastrarEmpresa(form)
      setEmpresa(empresa)
      aoConcluir?.(empresa)
      navigate('/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="card">
        <div className="brand">Gerencie<span>Já</span></div>
        <p className="subtitulo">Cadastre sua empresa para começar</p>

        <Alerta tipo="erro">{erro}</Alerta>

        <form onSubmit={enviar}>
          <div className="form-grid">
            <Campo label="Razão social" req full>
              <input value={form.razaoSocial} onChange={set('razaoSocial')}
                     placeholder="Minha Empresa LTDA" required />
            </Campo>
            <Campo label="Nome fantasia">
              <input value={form.nomeFantasia} onChange={set('nomeFantasia')} />
            </Campo>
            <Campo label="CNPJ" req ajuda="Com ou sem pontuação">
              <input value={form.cnpj}
                     onChange={(e) => setForm({ ...form, cnpj: maskDocument(e.target.value) })}
                     placeholder="12.345.678/0001-95" required />
            </Campo>
            <Campo label="Inscrição estadual">
              <input value={form.inscricaoEstadual} onChange={set('inscricaoEstadual')} />
            </Campo>
            <Campo label="Regime tributário" req full
                   ajuda="Define se ICMS/PIS/COFINS entram no custo dos produtos">
              <select value={form.regimeTributario} onChange={set('regimeTributario')}>
                {REGIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Campo>
          </div>
          <div className="acoes-form">
            <button className="btn" disabled={enviando}>
              {enviando ? 'Cadastrando…' : 'Cadastrar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
