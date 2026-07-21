import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Title, Text, Table, Badge, Button, SimpleGrid, Group, Stack, Loader, Center, Alert,
} from '@mantine/core'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { statusNota } from './NotasEntrada'
import { formatDocument } from '../lib/format'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '—')

function Info({ label, children }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text fw={500}>{children}</Text>
    </div>
  )
}

export default function NotaEntradaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nota, setNota] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setErro(null)
    api.get(`/notas-entrada/${id}`).then(setNota).catch((e) => setErro(e.message))
  }, [id])

  return (
    <Stack>
      <PageHeader
        title={nota ? `Nota ${nota.numero} / ${nota.serie}` : 'Nota de entrada'}
        subtitle={nota ? nota.fornecedor : ''}
        action={<Button variant="default" onClick={() => navigate('/notas')}>← Voltar</Button>}
      />

      {erro && <Alert color="red">{erro}</Alert>}
      {nota === null && !erro && <Center p="xl"><Loader /></Center>}

      {nota && (
        <>
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>Dados da nota</Title>
              {statusNota(nota.status)}
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              <Info label="Fornecedor">{nota.fornecedor}</Info>
              <Info label="Documento">{formatDocument(nota.fornecedorDocumento)}</Info>
              <Info label="Modelo / Série / Número">{nota.modelo} · {nota.serie} · {nota.numero}</Info>
              <Info label="Natureza da operação">{nota.naturezaOperacao || '—'}</Info>
              <Info label="Emissão">{data(nota.dataEmissao)}</Info>
              <Info label="Entrada">{data(nota.dataEntrada)}</Info>
              <Info label="Chave de acesso">{nota.chaveAcesso || '—'}</Info>
            </SimpleGrid>
          </Card>

          <Card withBorder padding="lg">
            <Title order={4} mb="md">Itens</Title>
            <Table.ScrollContainer minWidth={760}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th><Table.Th>SKU</Table.Th><Table.Th>Produto</Table.Th>
                    <Table.Th>Cód. forn.</Table.Th><Table.Th ta="right">Qtd.</Table.Th>
                    <Table.Th ta="right">Vlr. unit.</Table.Th><Table.Th ta="right">Total</Table.Th>
                    <Table.Th ta="right">Custo aquis.</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {nota.itens.map((it) => (
                    <Table.Tr key={it.numero}>
                      <Table.Td>{it.numero}</Table.Td>
                      <Table.Td>{it.sku}</Table.Td>
                      <Table.Td>{it.produto}</Table.Td>
                      <Table.Td c="dimmed">{it.codigoNoFornecedor || '—'}</Table.Td>
                      <Table.Td ta="right">{qtd(it.quantidade)} {it.unidade}</Table.Td>
                      <Table.Td ta="right">{brl(it.valorUnitario)}</Table.Td>
                      <Table.Td ta="right">{brl(it.valorTotal)}</Table.Td>
                      <Table.Td ta="right" fw={600}>{brl(it.custoAquisicaoUnitario)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <Group gap="xl" mt="md">
              <Info label="Produtos">{brl(nota.valorProdutos)}</Info>
              <Info label="Frete">{brl(nota.valorFrete)}</Info>
              <Info label="Desconto">{brl(nota.valorDesconto)}</Info>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total da nota</Text>
                <Text fw={700} c="blue">{brl(nota.valorTotal)}</Text>
              </div>
            </Group>
          </Card>

          <Card withBorder padding="lg">
            <Title order={4} mb="md">Contas a pagar geradas</Title>
            {nota.contas.length === 0
              ? <Text c="dimmed">Sem parcelas (compra à vista ou totalmente bonificada).</Text>
              : (
                <Table.ScrollContainer minWidth={600}>
                  <Table verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Duplicata</Table.Th><Table.Th>Parcela</Table.Th>
                        <Table.Th>Vencimento</Table.Th><Table.Th ta="right">Valor</Table.Th>
                        <Table.Th ta="right">Pago</Table.Th><Table.Th>Situação</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {nota.contas.map((c) => (
                        <Table.Tr key={c.id}>
                          <Table.Td>{c.numeroDuplicata || '—'}</Table.Td>
                          <Table.Td>{c.parcela}/{c.totalParcelas}</Table.Td>
                          <Table.Td>{data(c.vencimento)}</Table.Td>
                          <Table.Td ta="right" fw={600}>{brl(c.valor)}</Table.Td>
                          <Table.Td ta="right" c="dimmed">{brl(c.valorPago)}</Table.Td>
                          <Table.Td><Badge variant="light" color="gray">{c.status}</Badge></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
          </Card>
        </>
      )}
    </Stack>
  )
}
