import { useEffect, useState } from 'react'
import {
  Table, Button, Group, Stack, Badge, Card, Text, Loader, Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { ModalNovaPessoa } from '../components/ModalNovaPessoa'
import { ModalEditarPessoa } from '../components/ModalEditarPessoa'
import { formatDocument } from '../lib/format'

export default function Pessoas() {
  const [lista, setLista] = useState(null)
  const [erro, setErro] = useState(null)
  const [aberto, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)

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
                  <Table.Th>Contato</Table.Th><Table.Th>Endereço</Table.Th><Table.Th />
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
                    <Table.Td>
                      {p.enderecos?.length
                        ? <Text size="sm">{p.enderecos[0].cidade}/{p.enderecos[0].uf}</Text>
                        : <Badge size="sm" variant="light" color="yellow">falta</Badge>}
                    </Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="compact-sm" onClick={() => setEditando(p)}>
                        Editar
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      <ModalNovaPessoa opened={aberto} onClose={close} onCriado={carregar} />
      <ModalEditarPessoa pessoa={editando} onClose={() => setEditando(null)} onSalvo={carregar} />
    </Stack>
  )
}
