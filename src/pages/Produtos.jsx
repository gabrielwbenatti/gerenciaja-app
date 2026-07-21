import { useEffect, useMemo, useState } from 'react'
import {
  Table, Button, Modal, TextInput, NumberInput, Select, Switch,
  Group, Stack, Badge, Card, Text, Loader, Center,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { normalizeBusca } from '../lib/format'

const UNIDADES = ['UN', 'KG', 'G', 'CX', 'L', 'ML', 'M', 'M2', 'M3', 'PC']
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export default function Produtos() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [aberto, { open, close }] = useDisclosure(false)

  const listaFiltrada = useMemo(() => {
    if (!lista) return null
    const q = normalizeBusca(filtro)
    if (!q) return lista
    return lista.filter((p) =>
      normalizeBusca([p.sku, p.nome, p.descricao, p.codigoBarras].filter(Boolean).join(' ')).includes(q))
  }, [lista, filtro])

  async function carregar() {
    setErro(null)
    try {
      setLista(await api.get('/produtos'))
    } catch (err) {
      setErro(err.message)
    }
  }

  useEffect(() => { carregar() }, [])

  async function alternarSituacao(p) {
    try {
      await api.patch(`/produtos/${p.id}/situacao`, { ativo: !p.ativo })
      carregar()
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Produtos"
        subtitle="Catálogo de itens"
        action={<Button onClick={open}>Novo produto</Button>}
      />

      {lista && lista.length > 0 && (
        <TextInput
          placeholder="Buscar por SKU, nome ou código de barras…"
          value={filtro}
          onChange={(e) => setFiltro(e.currentTarget.value)}
          maw={420}
        />
      )}

      <Card withBorder padding={0}>
        {erro && <Text c="red" p="md">{erro}</Text>}
        {lista === null && !erro && <Center p="xl"><Loader /></Center>}
        {lista && lista.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">Nenhum produto cadastrado ainda.</Text>
        )}
        {lista && lista.length > 0 && listaFiltrada.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">Nenhum produto encontrado para “{filtro}”.</Text>
        )}
        {listaFiltrada && listaFiltrada.length > 0 && (
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SKU</Table.Th><Table.Th>Nome</Table.Th><Table.Th>Un.</Table.Th>
                  <Table.Th ta="right">Preço venda</Table.Th>
                  <Table.Th ta="right">Custo médio</Table.Th>
                  <Table.Th>Lote</Table.Th><Table.Th>Situação</Table.Th><Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {listaFiltrada.map((p) => (
                  <Table.Tr key={p.id} opacity={p.ativo ? 1 : 0.5}>
                    <Table.Td>{p.sku}</Table.Td>
                    <Table.Td>{p.nome}</Table.Td>
                    <Table.Td>{p.unidadeMedida}</Table.Td>
                    <Table.Td ta="right">{brl(p.precoVenda)}</Table.Td>
                    <Table.Td ta="right">{brl(p.custoMedio)}</Table.Td>
                    <Table.Td>
                      {p.controlaLote ? <Badge variant="light">Controla</Badge> : <Text c="dimmed">—</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={p.ativo ? 'green' : 'gray'} variant="light">
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="compact-sm" onClick={() => alternarSituacao(p)}>
                        {p.ativo ? 'Inativar' : 'Reativar'}
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal opened={aberto} onClose={close} title="Novo produto" size="lg">
        <FormProduto aoSalvar={() => { close(); carregar() }} />
      </Modal>
    </Stack>
  )
}

function FormProduto({ aoSalvar }) {
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      sku: '', nome: '', codigoBarras: '', unidadeMedida: 'UN',
      precoVenda: '', estoqueMinimo: '', controlaLote: false, ncm: '',
    },
    validate: {
      sku: (v) => (v.trim() ? null : 'Informe o SKU'),
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
    },
  })

  async function enviar(values) {
    setEnviando(true)
    try {
      await api.post('/produtos', {
        sku: values.sku,
        nome: values.nome,
        codigoBarras: values.codigoBarras || null,
        unidadeMedida: values.unidadeMedida,
        precoVenda: values.precoVenda === '' ? 0 : Number(values.precoVenda),
        estoqueMinimo: values.estoqueMinimo === '' ? 0 : Number(values.estoqueMinimo),
        controlaLote: values.controlaLote,
        dadosFiscais: values.ncm ? { ncm: values.ncm } : null,
      })
      notifications.show({ color: 'green', message: `${values.nome} cadastrado.` })
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
        <Group grow>
          <TextInput label="SKU" withAsterisk data-autofocus placeholder="ARROZ-5KG"
                     {...form.getInputProps('sku')} />
          <TextInput label="Código de barras (EAN)" {...form.getInputProps('codigoBarras')} />
        </Group>
        <TextInput label="Nome" withAsterisk {...form.getInputProps('nome')} />
        <Group grow>
          <Select label="Unidade" data={UNIDADES} allowDeselect={false}
                  {...form.getInputProps('unidadeMedida')} />
          <TextInput label="NCM" maxLength={8} placeholder="opcional — usado na NF-e"
                     {...form.getInputProps('ncm')} />
        </Group>
        <Group grow>
          <NumberInput label="Preço de venda" min={0} decimalScale={2} prefix="R$ "
                       thousandSeparator="." decimalSeparator=","
                       {...form.getInputProps('precoVenda')} />
          <NumberInput label="Estoque mínimo" min={0} decimalScale={3}
                       {...form.getInputProps('estoqueMinimo')} />
        </Group>
        <Switch label="Este produto controla lote e validade"
                description="Para alimentos, cosméticos, medicamentos"
                {...form.getInputProps('controlaLote', { type: 'checkbox' })} />
        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar</Button>
        </Group>
      </Stack>
    </form>
  )
}
