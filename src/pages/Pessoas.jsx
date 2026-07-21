import { useEffect, useState } from 'react'
import {
  Table, Button, Modal, TextInput, Select, Chip, Group, Stack, Badge,
  Card, Text, Loader, Center,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { maskDocument, formatDocument, limparDocumento } from '../lib/format'

const PAPEIS = ['CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA', 'VENDEDOR']

export default function Pessoas() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [aberto, { open, close }] = useDisclosure(false)

  async function carregar() {
    setErro(null)
    try {
      setLista(await api.get('/pessoas'))
    } catch (err) {
      setErro(err.message)
    }
  }

  useEffect(() => { carregar() }, [])

  return (
    <Stack>
      <PageHeader
        title="Pessoas"
        subtitle="Clientes, fornecedores e demais contatos"
        action={<Button onClick={open}>Nova pessoa</Button>}
      />

      <Card withBorder padding={0}>
        {erro && <Text c="red" p="md">{erro}</Text>}
        {lista === null && !erro && <Center p="xl"><Loader /></Center>}
        {lista && lista.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">Nenhuma pessoa cadastrada ainda.</Text>
        )}
        {lista && lista.length > 0 && (
          <Table.ScrollContainer minWidth={700}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th><Table.Th>Tipo</Table.Th>
                  <Table.Th>Documento</Table.Th><Table.Th>Papéis</Table.Th>
                  <Table.Th>Contato</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lista.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text fw={500}>{p.nome}</Text>
                      {p.nomeFantasia && <Text size="sm" c="dimmed">{p.nomeFantasia}</Text>}
                    </Table.Td>
                    <Table.Td>{p.tipo}</Table.Td>
                    <Table.Td>{formatDocument(p.documento)}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {p.papeis.map((pp) => <Badge key={pp} variant="light" size="sm">{pp}</Badge>)}
                      </Group>
                    </Table.Td>
                    <Table.Td>{p.email || p.telefone || '—'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal opened={aberto} onClose={close} title="Nova pessoa" size="lg">
        <FormPessoa aoSalvar={() => { close(); carregar() }} />
      </Modal>
    </Stack>
  )
}

function FormPessoa({ aoSalvar }) {
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      tipo: 'PJ', documento: '', nome: '', nomeFantasia: '',
      papeis: ['CLIENTE'], email: '', telefone: '',
    },
    validate: {
      documento: (v, values) => {
        const n = limparDocumento(v).length
        const esperado = values.tipo === 'PF' ? 11 : 14
        return n === esperado ? null : `${values.tipo === 'PF' ? 'CPF' : 'CNPJ'} incompleto`
      },
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
      papeis: (v) => (v.length ? null : 'Selecione ao menos um papel'),
    },
  })

  // Máscara + detecção de PF/PJ pelo tamanho (o Select ainda permite ajuste manual).
  function onDocumento(e) {
    const mascarado = maskDocument(e.currentTarget.value)
    const qtd = limparDocumento(mascarado).length
    form.setFieldValue('documento', mascarado)
    if (qtd >= 12) form.setFieldValue('tipo', 'PJ')
    else if (qtd === 11) form.setFieldValue('tipo', 'PF')
  }

  async function enviar(values) {
    setEnviando(true)
    try {
      const corpo = { ...values }
      if (!corpo.email) delete corpo.email
      await api.post('/pessoas', corpo)
      notifications.show({ color: 'green', message: `${values.nome} cadastrado(a).` })
      aoSalvar()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Group grow align="flex-start">
          <TextInput label="CPF / CNPJ" withAsterisk data-autofocus
                     placeholder="CPF (11 dígitos) ou CNPJ (14)"
                     description="O tipo se ajusta sozinho"
                     value={form.values.documento} onChange={onDocumento}
                     error={form.errors.documento} />
          <Select label="Tipo" data={[
                    { value: 'PJ', label: 'Pessoa Jurídica' },
                    { value: 'PF', label: 'Pessoa Física' },
                  ]} allowDeselect={false} {...form.getInputProps('tipo')} />
        </Group>
        <TextInput label="Nome / Razão social" withAsterisk {...form.getInputProps('nome')} />
        <Group grow>
          <TextInput label="Nome fantasia" {...form.getInputProps('nomeFantasia')} />
          <TextInput label="E-mail" type="email" {...form.getInputProps('email')} />
        </Group>
        <TextInput label="Telefone" {...form.getInputProps('telefone')} />

        <div>
          <Text size="sm" fw={500} mb={4}>Papéis <Text span c="red">*</Text></Text>
          <Chip.Group multiple value={form.values.papeis}
                      onChange={(v) => form.setFieldValue('papeis', v)}>
            <Group gap="xs">
              {PAPEIS.map((p) => <Chip key={p} value={p}>{p}</Chip>)}
            </Group>
          </Chip.Group>
          {form.errors.papeis && <Text c="red" size="xs" mt={4}>{form.errors.papeis}</Text>}
        </div>

        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar</Button>
        </Group>
      </Stack>
    </form>
  )
}
