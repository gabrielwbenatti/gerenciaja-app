import { useEffect, useMemo, useState } from 'react'
import {
  Table, Button, TextInput, Stack, Badge, Card, Text, Loader, Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { ModalNovoProduto } from '../components/ModalNovoProduto'
import { ModalEditarProduto } from '../components/ModalEditarProduto'
import { normalizeBusca } from '../lib/format'

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export default function Produtos() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [aberto, { open, close }] = useDisclosure(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [editando, { open: abrirEdicao, close: fecharEdicao }] = useDisclosure(false)

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

  function editar(p) {
    setProdutoEditando(p)
    abrirEdicao()
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
                  <Table.Th>Estoque</Table.Th><Table.Th>Lote</Table.Th>
                  <Table.Th>Situação</Table.Th><Table.Th /><Table.Th />
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
                      {p.controlaEstoque === false
                        ? <Badge variant="light" color="gray">Serviço</Badge>
                        : <Badge variant="light" color="teal">Controla</Badge>}
                    </Table.Td>
                    <Table.Td>
                      {p.controlaLote ? <Badge variant="light">Controla</Badge> : <Text c="dimmed">—</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={p.ativo ? 'green' : 'gray'} variant="light">
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="compact-sm" onClick={() => editar(p)}>
                        Editar
                      </Button>
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

      <ModalNovoProduto opened={aberto} onClose={close} onCriado={carregar} />
      <ModalEditarProduto produto={produtoEditando} opened={editando}
                          onClose={fecharEdicao} onSalvo={carregar} />
    </Stack>
  )
}
