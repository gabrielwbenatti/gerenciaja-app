import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  Card, TextInput, PasswordInput, Select, Button, Title, Text, Stack, SimpleGrid,
  Center, Divider, Group,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { api } from '../api'
import { setSessao } from '../sessao'
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
      nome: '', email: '', senha: '',
    },
    validate: {
      razaoSocial: (v) => (v.trim() ? null : 'Informe a razão social'),
      cnpj: (v) => (limparDocumento(v).length === 14 ? null : 'CNPJ deve ter 14 dígitos'),
      nome: (v) => (v.trim() ? null : 'Informe seu nome'),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v.trim()) ? null : 'E-mail inválido'),
      senha: (v) => (v.length >= 8 ? null : 'A senha precisa de ao menos 8 caracteres'),
    },
  })

  async function enviar(values) {
    setErro(null)
    setEnviando(true)
    try {
      // O cadastro ja devolve a sessao autenticada -- quem acabou de escolher a
      // senha nao precisa digitar de novo numa tela de login.
      const sessao = await api.cadastrarEmpresa({
        razaoSocial: values.razaoSocial,
        nomeFantasia: values.nomeFantasia,
        cnpj: values.cnpj,
        inscricaoEstadual: values.inscricaoEstadual,
        regimeTributario: values.regimeTributario,
        usuario: { nome: values.nome, email: values.email.trim(), senha: values.senha },
      })
      setSessao(sessao)
      aoConcluir?.(sessao)
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
            <Divider my="xs" label="Seu acesso" labelPosition="left" />
            <Text size="xs" c="dimmed" mt={-8}>
              É com esses dados que você vai entrar no sistema — inclusive de outro
              computador ou navegador.
            </Text>
            <TextInput label="Seu nome" withAsterisk placeholder="João da Silva"
                       {...form.getInputProps('nome')} />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="E-mail" withAsterisk type="email"
                         placeholder="voce@empresa.com.br"
                         {...form.getInputProps('email')} />
              <PasswordInput label="Senha" withAsterisk
                             {...form.getInputProps('senha')} />
            </SimpleGrid>

            <Button type="submit" loading={enviando} mt="sm">Cadastrar empresa</Button>
          </Stack>
        </form>

        <Group justify="center" mt="lg" gap={6}>
          <Text size="sm" c="dimmed">Já tem conta?</Text>
          <Text size="sm" component={Link} to="/login" c="blue" fw={500}>Entrar</Text>
        </Group>
      </Card>
    </Center>
  )
}
