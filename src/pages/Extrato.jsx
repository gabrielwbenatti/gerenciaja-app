import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table, Text, Card, Loader, Center, Stack, Alert, Button } from '@mantine/core'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'

const qtd = (v) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v ?? 0)
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function origem(tipo, id) {
  if (!tipo) return '—'
  const rotulos = { NF_ENTRADA: 'NF entrada', VENDA: 'Venda', AJUSTE: 'Ajuste', TRANSFERENCIA: 'Transferência' }
  return `${rotulos[tipo] || tipo}${id ? ' #' + id : ''}`
}

const TIPO_LABEL = {
  COMPRA: 'Compra', VENDA: 'Venda', AJUSTE: 'Ajuste',
  DEVOLUCAO_CLIENTE: 'Devol. cliente', DEVOLUCAO_FORNECEDOR: 'Devol. fornecedor',
  TRANSFERENCIA: 'Transferência', PERDA: 'Perda', ESTORNO: 'Estorno',
}

export default function Extrato() {
  const { produtoId } = useParams()
  const navigate = useNavigate()
  const [produto, setProduto] = useState(null)
  const [linhas, setLinhas] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setErro(null)
    Promise.all([
      api.get(`/produtos/${produtoId}`),
      api.get(`/estoque/produtos/${produtoId}/extrato`),
    ])
      .then(([p, ext]) => { setProduto(p); setLinhas(ext) })
      .catch((e) => setErro(e.message))
  }, [produtoId])

  const saldoAtual = linhas && linhas.length > 0 ? linhas[linhas.length - 1].saldoAcumulado : 0

  return (
    <Stack>
      <PageHeader
        title={produto ? `Extrato — ${produto.nome}` : 'Extrato'}
        subtitle={produto ? `SKU ${produto.sku} · saldo atual ${qtd(saldoAtual)} ${produto.unidadeMedida}` : ''}
        action={<Button variant="default" onClick={() => navigate('/estoque')}>← Voltar ao estoque</Button>}
      />

      {erro && <Alert color="red">{erro}</Alert>}
      {linhas === null && !erro && <Center p="xl"><Loader /></Center>}

      {linhas && (
        <Card withBorder padding={0}>
          {linhas.length === 0 && (
            <Text c="dimmed" ta="center" p="xl">
              Nenhum movimento — este produto ainda não teve entradas nem saídas.
            </Text>
          )}
          {linhas.length > 0 && (
            <Table.ScrollContainer minWidth={820}>
              <Table verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Lote</Table.Th>
                    <Table.Th>Depósito</Table.Th><Table.Th ta="right">Quantidade</Table.Th>
                    <Table.Th ta="right">Custo unit.</Table.Th><Table.Th>Origem</Table.Th>
                    <Table.Th ta="right">Saldo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {linhas.map((m, i) => {
                    const entrada = Number(m.quantidade) >= 0
                    return (
                      <Table.Tr key={i}>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>{dataHora(m.dataMovimento)}</Table.Td>
                        <Table.Td>{TIPO_LABEL[m.tipo] || m.tipo}</Table.Td>
                        <Table.Td>{m.loteCodigo === 'SINTETICO' ? <Text c="dimmed">—</Text> : m.loteCodigo}</Table.Td>
                        <Table.Td>{m.depositoNome}</Table.Td>
                        <Table.Td ta="right" fw={600} c={entrada ? 'green' : 'red'}>
                          {entrada ? '+' : ''}{qtd(m.quantidade)}
                        </Table.Td>
                        <Table.Td ta="right" c="dimmed">{brl(m.custoUnitario)}</Table.Td>
                        <Table.Td>{origem(m.origemTipo, m.origemId)}</Table.Td>
                        <Table.Td ta="right" fw={600}>{qtd(m.saldoAcumulado)}</Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      )}
    </Stack>
  )
}
