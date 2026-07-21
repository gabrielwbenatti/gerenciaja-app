import { useEffect, useState } from 'react'
import { Card, Switch, Stack, Text, Loader, Center, Alert } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { getEmpresa, setEmpresa } from '../tenant'
import { PageHeader } from '../components/PageHeader'

export default function Configuracoes() {
  const empresaLocal = getEmpresa()
  const [config, setConfig] = useState(null)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  // Busca a config atual do backend (fonte de verdade), não do localStorage.
  useEffect(() => {
    api.get(`/empresas/${empresaLocal.id}`)
      .then((e) => setConfig({ documentoPessoaObrigatorio: e.documentoPessoaObrigatorio }))
      .catch((e) => setErro(e.message))
  }, [empresaLocal.id])

  async function alterar(campo, valor) {
    setSalvando(true)
    const anterior = config
    setConfig({ ...config, [campo]: valor })
    try {
      const atualizada = await api.patch(`/empresas/${empresaLocal.id}/config`, { [campo]: valor })
      // Atualiza só o campo no localStorage, preservando depositoPadraoId e afins.
      setEmpresa({ ...empresaLocal, [campo]: atualizada[campo] })
      notifications.show({ color: 'green', message: 'Configuração salva.' })
    } catch (err) {
      setConfig(anterior) // desfaz o otimismo em caso de erro
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Stack>
      <PageHeader title="Configurações" subtitle="Ajustes da empresa" />
      {erro && <Alert color="red">{erro}</Alert>}
      {config === null && !erro && <Center p="xl"><Loader /></Center>}
      {config && (
        <Card withBorder padding="lg">
          <Text fw={600} mb="md">Cadastro de pessoas</Text>
          <Switch
            label="Exigir CPF/CNPJ ao cadastrar pessoas"
            description="Desligue para permitir salvar clientes e fornecedores sem documento."
            checked={config.documentoPessoaObrigatorio}
            disabled={salvando}
            onChange={(e) => alterar('documentoPessoaObrigatorio', e.currentTarget.checked)}
          />
        </Card>
      )}
    </Stack>
  )
}
