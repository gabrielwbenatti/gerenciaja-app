import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Badge, Card, Text, Loader, Center, Stack, Alert, Button, Group,
  TextInput, Select, Modal,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { normalizeBusca } from '../lib/format'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

const STATUS = {
  ORCAMENTO: { color: 'gray', label: 'Orçamento' },
  CONFIRMADA: { color: 'blue', label: 'Confirmada' },
  SEPARACAO: { color: 'indigo', label: 'Separação' },
  FATURADA: { color: 'green', label: 'Faturada' },
  ENTREGUE: { color: 'teal', label: 'Entregue' },
  CANCELADA: { color: 'red', label: 'Cancelada' },
}

export function statusVenda(status) {
  const s = STATUS[status] || { color: 'gray', label: status }
  return <Badge color={s.color} variant="light">{s.label}</Badge>
}

export default function Vendas() {
  const navigate = useNavigate()
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [status, setStatus] = useState(null)
  const [cancelando, setCancelando] = useState(null)

  async function carregar() {
    setErro(null)
    try {
      setLista(await api.get('/vendas' + (status ? `?status=${status}` : '')))
    } catch (err) {
      setErro(err.message)
    }
  }

  useEffect(() => { carregar() }, [status])

  const listaFiltrada = useMemo(() => {
    if (!lista) return null
    const q = normalizeBusca(filtro)
    if (!q) return lista
    return lista.filter((v) => normalizeBusca(`${v.numero} ${v.cliente}`).includes(q))
  }, [lista, filtro])

  async function confirmarCancelamento() {
    try {
      await api.post(`/vendas/${cancelando.id}/cancelamento`)
      notifications.show({ color: 'green', message: `Pedido ${cancelando.numero} cancelado.` })
      setCancelando(null)
      carregar()
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao cancelar', message: err.message })
    }
  }

  return (
    <Stack>
      <PageHeader
        title="Pedidos de venda"
        subtitle="Orçamentos e pedidos emitidos"
        action={<Button onClick={() => navigate('/vendas/novo')}>Novo pedido</Button>}
      />

      <Group>
        <TextInput
          placeholder="Buscar por número ou cliente…"
          value={filtro}
          onChange={(e) => setFiltro(e.currentTarget.value)}
          w={320}
        />
        <Select
          placeholder="Todas as situações"
          value={status}
          onChange={setStatus}
          clearable
          w={200}
          data={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
        />
      </Group>

      <Card withBorder padding={0}>
        {erro && <Alert color="red" m="md">{erro}</Alert>}
        {lista === null && !erro && <Center p="xl"><Loader /></Center>}
        {lista && lista.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">
            Nenhum pedido por aqui. Use “Novo pedido” para lançar o primeiro.
          </Text>
        )}
        {lista && lista.length > 0 && listaFiltrada.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">Nenhum pedido encontrado para “{filtro}”.</Text>
        )}
        {listaFiltrada && listaFiltrada.length > 0 && (
          <Table.ScrollContainer minWidth={860}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nº</Table.Th><Table.Th>Cliente</Table.Th>
                  <Table.Th>Emissão</Table.Th><Table.Th ta="center">Itens</Table.Th>
                  <Table.Th ta="right">Bruto</Table.Th><Table.Th ta="right">Desconto</Table.Th>
                  <Table.Th ta="right">Líquido</Table.Th>
                  <Table.Th>Situação</Table.Th><Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {listaFiltrada.map((v) => (
                  <Table.Tr key={v.id} style={{ cursor: 'pointer' }}
                            opacity={v.status === 'CANCELADA' ? 0.5 : 1}
                            onClick={() => navigate(`/vendas/${v.id}`)}>
                    <Table.Td fw={600}>{v.numero}</Table.Td>
                    <Table.Td>{v.cliente}</Table.Td>
                    <Table.Td>{data(v.dataVenda)}</Table.Td>
                    <Table.Td ta="center">{v.quantidadeItens}</Table.Td>
                    <Table.Td ta="right">{brl(v.valorBruto)}</Table.Td>
                    <Table.Td ta="right" c={v.desconto > 0 ? 'orange' : 'dimmed'}>
                      {v.desconto > 0 ? `− ${brl(v.desconto)}` : '—'}
                    </Table.Td>
                    <Table.Td ta="right" fw={600}>{brl(v.valorLiquido)}</Table.Td>
                    <Table.Td>{statusVenda(v.status)}</Table.Td>
                    <Table.Td>
                      {v.status === 'ORCAMENTO' && (
                        <Button variant="subtle" color="red" size="compact-sm"
                                onClick={(e) => { e.stopPropagation(); setCancelando(v) }}>
                          Cancelar
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <Modal opened={!!cancelando} onClose={() => setCancelando(null)} title="Cancelar pedido">
        <Stack>
          <Text size="sm">
            O pedido {cancelando?.numero} de {cancelando?.cliente} será marcado como cancelado.
            Ele continua no histórico, mas não poderá mais ser editado.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCancelando(null)}>Voltar</Button>
            <Button color="red" onClick={confirmarCancelamento}>Cancelar pedido</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
