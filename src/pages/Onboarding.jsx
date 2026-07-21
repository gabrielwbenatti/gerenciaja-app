import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, TextInput, Select, Button, Title, Text, Stack, SimpleGrid, Center } from '@mantine/core'
import { useForm } from '@mantine/form'
import { api } from '../api'
import { setEmpresa } from '../tenant'
import { maskDocument, limparDocumento } from '../lib/format'

const REGIMES = [
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
]

export default function Onboarding({ aoConcluir }) {
  const navigate = useNavigate()
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      razaoSocial: '', nomeFantasia: '', cnpj: '', inscricaoEstadual: '',
      regimeTributario: 'SIMPLES_NACIONAL',
    },
    validate: {
      razaoSocial: (v) => (v.trim() ? null : 'Informe a razão social'),
      cnpj: (v) => (limparDocumento(v).length === 14 ? null : 'CNPJ deve ter 14 dígitos'),
    },
  })

  async function enviar(values) {
    setErro(null)
    setEnviando(true)
    try {
      const empresa = await api.cadastrarEmpresa(values)
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
    <Center mih="100vh" p="md">
      <Card withBorder padding="xl" w="100%" maw={520} shadow="sm">
        <Title order={2} ta="center">
          Gerencie<Text span c="blue" inherit>Já</Text>
        </Title>
        <Text c="dimmed" ta="center" mb="lg">Cadastre sua empresa para começar</Text>

        <form onSubmit={form.onSubmit(enviar)}>
          <Stack>
            {erro && <Text c="red" size="sm">{erro}</Text>}
            <TextInput label="Razão social" withAsterisk placeholder="Minha Empresa LTDA"
                       {...form.getInputProps('razaoSocial')} />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Nome fantasia" {...form.getInputProps('nomeFantasia')} />
              <TextInput label="CNPJ" withAsterisk placeholder="12.345.678/0001-95"
                         {...form.getInputProps('cnpj')}
                         onChange={(e) => form.setFieldValue('cnpj', maskDocument(e.currentTarget.value))} />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Inscrição estadual" {...form.getInputProps('inscricaoEstadual')} />
              <Select label="Regime tributário" withAsterisk data={REGIMES} allowDeselect={false}
                      {...form.getInputProps('regimeTributario')} />
            </SimpleGrid>
            <Button type="submit" loading={enviando} mt="sm">Cadastrar empresa</Button>
          </Stack>
        </form>
      </Card>
    </Center>
  )
}
