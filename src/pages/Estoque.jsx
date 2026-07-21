import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Badge, Card, Text, Loader, Center, Stack, Alert, Button } from '@mantine/core'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'

const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)

function situacao(zerado, abaixoMinimo) {
  if (zerado) return <Badge color="red" variant="light">Zerado</Badge>
  if (abaixoMinimo) return <Badge color="yellow" variant="light">Abaixo do mínimo</Badge>
  return <Badge color="green" variant="light">OK</Badge>
}

export default function Estoque() {
  const navigate = useNavigate()
  const [saldos, setSaldos] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/estoque/saldos').then(setSaldos).catch((e) => setErro(e.message))
  }, [])

  return (
    <Stack>
      <PageHeader title="Estoque"
        subtitle="Saldo consolidado por produto (todos os lotes e depósitos)" />
      <Card withBorder padding={0}>
        {erro && <Alert color="red" m="md">{erro}</Alert>}
        {saldos === null && !erro && <Center p="xl"><Loader /></Center>}
        {saldos && saldos.length === 0 && (
          <Text c="dimmed" ta="center" p="xl">Nenhum produto cadastrado ainda.</Text>
        )}
        {saldos && saldos.length > 0 && (
          <Table.ScrollContainer minWidth={820}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SKU</Table.Th><Table.Th>Produto</Table.Th><Table.Th>Un.</Table.Th>
                  <Table.Th ta="right">Em mãos</Table.Th><Table.Th ta="right">Reservado</Table.Th>
                  <Table.Th ta="right">Disponível</Table.Th><Table.Th ta="right">Mínimo</Table.Th>
                  <Table.Th>Situação</Table.Th><Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {saldos.map((s) => {
                  const disponivel = Number(s.quantidade) - Number(s.reservada)
                  const abaixoMinimo = Number(s.quantidade) < Number(s.estoqueMinimo)
                  const zerado = Number(s.quantidade) <= 0
                  return (
                    <Table.Tr key={s.produtoId} style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/estoque/${s.produtoId}`)}>
                      <Table.Td>{s.sku}</Table.Td>
                      <Table.Td>{s.nome}</Table.Td>
                      <Table.Td>{s.unidade}</Table.Td>
                      <Table.Td ta="right">{qtd(s.quantidade)}</Table.Td>
                      <Table.Td ta="right" c="dimmed">{qtd(s.reservada)}</Table.Td>
                      <Table.Td ta="right" fw={600}>{qtd(disponivel)}</Table.Td>
                      <Table.Td ta="right" c="dimmed">{qtd(s.estoqueMinimo)}</Table.Td>
                      <Table.Td>{situacao(zerado, abaixoMinimo)}</Table.Td>
                      <Table.Td>
                        <Button variant="subtle" size="compact-sm">Extrato →</Button>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>
    </Stack>
  )
}
