import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Badge, Card, Text, Loader, Center, Stack, Alert } from '@mantine/core'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

const STATUS = {
  ESCRITURADA: { color: 'green', label: 'Escriturada' },
  DIGITADA: { color: 'gray', label: 'Digitada' },
  CONFERIDA: { color: 'blue', label: 'Conferida' },
  CANCELADA: { color: 'red', label: 'Cancelada' },
}

export function statusNota(status) {
  const s = STATUS[status] || { color: 'gray', label: status }
  return <Badge color={s.color} variant="light">{s.label}</Badge>
}

export default function NotasEntrada() {
  const navigate = useNavigate()
  const [notas, setNotas] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/notas-entrada').then(setNotas).catch((e) => setErro(e.message))
  }, [])

  return (
    <Stack>
      <PageHeader title="Notas de entrada" subtitle="Notas fiscais de compra lançadas" />
      <Card withBorder padding={0}>
        {erro && <Alert color="red" m="md">{erro}</Alert>}
        {notas === null && !erro && <Center p="xl"><Loader /></Center>}
        {notas && notas.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">
            Nenhuma nota lançada. Use “Entrada de mercadoria” para lançar a primeira.
          </Text>
        )}
        {notas && notas.length > 0 && (
          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nº / Série</Table.Th><Table.Th>Fornecedor</Table.Th>
                  <Table.Th>Emissão</Table.Th><Table.Th>Entrada</Table.Th>
                  <Table.Th ta="right">Valor</Table.Th><Table.Th>Situação</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {notas.map((n) => (
                  <Table.Tr key={n.id} style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/notas/${n.id}`)}>
                    <Table.Td>{n.numero} <Text span c="dimmed">/ {n.serie}</Text></Table.Td>
                    <Table.Td>{n.fornecedor}</Table.Td>
                    <Table.Td>{data(n.dataEmissao)}</Table.Td>
                    <Table.Td>{data(n.dataEntrada)}</Table.Td>
                    <Table.Td ta="right" fw={600}>{brl(n.valorTotal)}</Table.Td>
                    <Table.Td>{statusNota(n.status)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  )
}
