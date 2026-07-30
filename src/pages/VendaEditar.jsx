import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card, TextInput, NumberInput, Textarea, Button, ActionIcon, Grid, Group,
  Stack, Text, Title, Divider, Loader, Center, Alert, Tooltip, Badge,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { getEmpresa } from '../sessao'
import { PageHeader } from '../components/PageHeader'
import { ModalNovoProduto } from '../components/ModalNovoProduto'
import { ModalNovaPessoa } from '../components/ModalNovaPessoa'
import { SelectComCadastro } from '../components/SelectComCadastro'
import { formatDocument, normalizeBusca } from '../lib/format'
import { statusVenda } from './Vendas'

// Filtro que ignora formatação: "60575" acha "60.575...". Vale para nome e doc.
const filtroBusca = ({ options, search }) => {
  const q = normalizeBusca(search)
  if (!q) return options
  return options.filter((o) => o.label && normalizeBusca(o.label).includes(q))
}

const hoje = () => new Date().toISOString().slice(0, 10)
const data = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : null)
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const num = (v) => (v === '' || v == null ? 0 : Number(v))
const arred2 = (v) => Math.round(v * 100) / 100

const itemVazio = () => ({
  produtoId: '', quantidade: '', precoUnitario: '', desconto: '', alocacoes: [],
})

export default function VendaEditar() {
  const { id } = useParams()
  const novo = !id

  const [clientes, setClientes] = useState(null)
  const [produtos, setProdutos] = useState(null)
  const [venda, setVenda] = useState(null)
  const [erroCarga, setErroCarga] = useState(null)
  const [acao, setAcao] = useState(false)

  useEffect(() => {
    const chamadas = [api.get('/pessoas?papel=CLIENTE'), api.get('/produtos')]
    if (!novo) chamadas.push(api.get(`/vendas/${id}`))

    Promise.all(chamadas)
      .then(([c, p, v]) => { setClientes(c); setProdutos(p); setVenda(v ?? null) })
      .catch((e) => setErroCarga(e.message))
  }, [id, novo])

  async function executar(rota, mensagem) {
    setAcao(true)
    try {
      setVenda(await api.post(`/vendas/${id}/${rota}`))
      notifications.show({ color: 'green', message: mensagem })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Não foi possível', message: err.message })
    } finally {
      setAcao(false)
    }
  }

  if (erroCarga) return <Alert color="red">{erroCarga}</Alert>
  if (!clientes || !produtos || (!novo && !venda)) return <Center p="xl"><Loader /></Center>

  return (
    <Stack>
      <PageHeader
        title={novo ? 'Novo pedido de venda' : `Pedido ${venda.numero}`}
        subtitle={novo
          ? 'A emissão pode ser retroativa e o mesmo produto pode entrar em mais de uma linha'
          : null}
        action={!novo && (
          <Group gap="sm">
            {statusVenda(venda.status)}
            {venda.status === 'ORCAMENTO' && (
              <Button loading={acao}
                      onClick={() => executar('confirmacao', 'Pedido confirmado — estoque reservado.')}>
                Confirmar
              </Button>
            )}
            {venda.status === 'CONFIRMADA' && (
              <Button color="green" loading={acao}
                      onClick={() => executar('faturamento', 'Pedido faturado — estoque baixado.')}>
                Faturar
              </Button>
            )}
          </Group>
        )}
      />
      {/* O status entra na key de propósito: o FormVenda calcula "editável" na
          montagem, então confirmar precisa remontá-lo para travar os campos. */}
      <FormVenda key={`${venda?.id ?? 'novo'}-${venda?.status ?? ''}`} venda={venda}
                 clientes={clientes} setClientes={setClientes}
                 produtos={produtos} setProdutos={setProdutos} />
    </Stack>
  )
}

function FormVenda({ venda, clientes, setClientes, produtos, setProdutos }) {
  const navigate = useNavigate()
  const empresa = getEmpresa()
  const novo = !venda
  // Fora do rascunho o pedido vira histórico: há reserva ou movimento de estoque
  // preso a ele, e retroagir data ou trocar cliente reescreveria um fato.
  const editavel = novo || venda.editavel

  const produtoPorId = useMemo(
    () => Object.fromEntries(produtos.map((p) => [String(p.id), p])), [produtos])
  const optClientes = useMemo(
    () => clientes.map((c) => ({
      value: String(c.id),
      label: c.documento ? `${c.nome} — ${formatDocument(c.documento)}` : c.nome,
    })), [clientes])
  const optProdutos = useMemo(
    () => produtos.map((p) => ({ value: String(p.id), label: `${p.sku} — ${p.nome}` })), [produtos])

  const [form, setForm] = useState(() => ({
    clienteId: novo ? '' : String(venda.clienteId),
    dataVenda: novo ? hoje() : venda.dataVenda,
    observacao: novo ? '' : (venda.observacao ?? ''),
    descontoPedido: novo ? '' : (venda.descontoPedido || ''),
  }))
  const [itens, setItens] = useState(() => novo
    ? [itemVazio()]
    : venda.itens.map((i) => ({
        produtoId: String(i.produtoId),
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        desconto: i.desconto || '',
        // Só para exibição: de quais lotes a linha saiu e a que custo. Não
        // volta no PUT — quem aloca é o backend, na confirmação.
        alocacoes: i.alocacoes ?? [],
        custoUnitarioBaixa: i.custoUnitarioBaixa,
      })))
  const [enviando, setEnviando] = useState(false)

  const setF = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }))
  function setItem(i, campo, valor) {
    setItens((arr) => arr.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)))
  }

  /** Ao escolher o produto, sugere o preço de tabela — só se o preço ainda estiver vazio. */
  function escolherProduto(i, produtoId) {
    aplicarProduto(i, produtoPorId[produtoId], produtoId || '')
  }

  function clienteCriado(pessoa) {
    setClientes((lista) => [...lista, pessoa])
    setF('clienteId')(String(pessoa.id))
  }

  /**
   * Produto cadastrado no modal: entra na lista e já assume a linha que o pediu.
   * Não dá para reaproveitar `escolherProduto` aqui — `produtoPorId` é memo sobre
   * `produtos` e ainda não enxerga o recém-criado nesta renderização.
   */
  function produtoCriado(i, produto) {
    setProdutos((lista) => [...lista, produto])
    aplicarProduto(i, produto, String(produto.id))
  }

  function aplicarProduto(i, produto, produtoId) {
    setItens((arr) => arr.map((it, idx) => idx !== i ? it : {
      ...it,
      produtoId,
      precoUnitario: it.precoUnitario === '' && produto ? produto.precoVenda : it.precoUnitario,
    }))
  }

  const brutoItem = (it) => arred2(num(it.quantidade) * num(it.precoUnitario))
  const totalItem = (it) => arred2(brutoItem(it) - num(it.desconto))

  const valorBruto = arred2(itens.reduce((s, it) => s + brutoItem(it), 0))
  const descontoItens = arred2(itens.reduce((s, it) => s + num(it.desconto), 0))
  const descontoTotal = arred2(descontoItens + num(form.descontoPedido))
  const valorLiquido = arred2(valorBruto - descontoTotal)

  async function enviar() {
    if (!form.clienteId) return notifications.show({ color: 'red', message: 'Selecione o cliente.' })
    if (!form.dataVenda) return notifications.show({ color: 'red', message: 'Informe a data de emissão.' })
    if (itens.some((it) => !it.produtoId))
      return notifications.show({ color: 'red', message: 'Toda linha precisa de um produto.' })
    if (itens.some((it) => num(it.quantidade) <= 0))
      return notifications.show({ color: 'red', message: 'Toda linha precisa de quantidade maior que zero.' })
    if (itens.some((it) => num(it.desconto) > brutoItem(it)))
      return notifications.show({ color: 'red', message: 'Há linha com desconto maior que o próprio valor.' })
    if (valorLiquido < 0)
      return notifications.show({ color: 'red', message: 'O desconto passa do valor dos itens.' })

    const corpo = {
      clienteId: Number(form.clienteId),
      dataVenda: form.dataVenda,
      observacao: form.observacao || null,
      descontoPedido: num(form.descontoPedido),
      itens: itens.map((it) => ({
        produtoId: Number(it.produtoId),
        quantidade: num(it.quantidade),
        precoUnitario: num(it.precoUnitario),
        desconto: num(it.desconto),
      })),
    }

    setEnviando(true)
    try {
      if (novo) {
        const r = await api.post('/vendas', { ...corpo, depositoId: empresa?.depositoPadraoId })
        notifications.show({ color: 'green', message: `Pedido ${r.numero} criado.` })
        navigate(`/vendas/${r.id}`, { replace: true })
      } else {
        await api.put(`/vendas/${venda.id}`, corpo)
        notifications.show({ color: 'green', message: `Pedido ${venda.numero} atualizado.` })
      }
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Stack>
      {!editavel && (
        <Alert color="yellow" title="Somente leitura">
          Este pedido está {venda.status.toLowerCase()} e não aceita mais alteração.
        </Alert>
      )}

      <Card withBorder padding="lg">
        <Title order={4} mb="md">Pedido</Title>
        <Stack>
          <Group grow align="flex-start">
            <SelectComCadastro label="Cliente" withAsterisk searchable data={optClientes}
                    value={form.clienteId || null} onChange={(v) => setF('clienteId')(v || '')}
                    filter={filtroBusca} disabled={!editavel}
                    placeholder="Buscar por nome ou documento…" nothingFoundMessage="Nada encontrado"
                    modal={ModalNovaPessoa} onCriado={clienteCriado}
                    modalProps={{ papeisIniciais: ['CLIENTE'], title: 'Novo cliente' }} />
            <TextInput label="Data de emissão" withAsterisk type="date" value={form.dataVenda}
                       onChange={(e) => setF('dataVenda')(e.currentTarget.value)}
                       disabled={!editavel} />
          </Group>
          <Text size="xs" c="dimmed">
            A emissão pode ser retroativa — lance o pedido com a data em que ele foi feito de fato.
          </Text>
          <Textarea label="Observação" autosize minRows={2} value={form.observacao}
                    onChange={(e) => setF('observacao')(e.currentTarget.value)}
                    disabled={!editavel} />
        </Stack>
      </Card>

      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Title order={4}>Itens</Title>
          <Text size="xs" c="dimmed">
            O mesmo produto pode ocupar mais de uma linha, com preços diferentes.
          </Text>
        </Group>

        <Stack gap="sm">
          {itens.map((it, i) => (
            <Card key={i} withBorder padding="sm" bg="var(--mantine-color-gray-0)">
              <Grid align="flex-end" gutter="xs">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <SelectComCadastro label={`Item ${i + 1}`} searchable data={optProdutos}
                          filter={filtroBusca}
                          value={it.produtoId || null}
                          onChange={(v) => escolherProduto(i, v)}
                          disabled={!editavel}
                          placeholder="Buscar produto…" nothingFoundMessage="Nada encontrado"
                          modal={ModalNovoProduto} onCriado={(p) => produtoCriado(i, p)} />
                </Grid.Col>
                <Grid.Col span={{ base: 4, md: 2 }}>
                  <NumberInput label="Quantidade" min={0} decimalScale={3} value={it.quantidade}
                               onChange={(v) => setItem(i, 'quantidade', v)} disabled={!editavel} />
                </Grid.Col>
                <Grid.Col span={{ base: 4, md: 2 }}>
                  <NumberInput label="Preço unit." min={0} decimalScale={4} prefix="R$ "
                               value={it.precoUnitario}
                               onChange={(v) => setItem(i, 'precoUnitario', v)} disabled={!editavel} />
                </Grid.Col>
                <Grid.Col span={{ base: 4, md: 2 }}>
                  <NumberInput label="Desconto" min={0} decimalScale={2} prefix="R$ "
                               value={it.desconto}
                               onChange={(v) => setItem(i, 'desconto', v)} disabled={!editavel} />
                </Grid.Col>
                <Grid.Col span={{ base: 8, md: 1 }}>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={600}>TOTAL</Text>
                    <Text fw={600}>{brl(totalItem(it))}</Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 4, md: 1 }}>
                  <Group justify="flex-end" gap={4}>
                    <Tooltip label="Duplicar linha">
                      <ActionIcon variant="subtle" disabled={!editavel}
                                  onClick={() => setItens((a) =>
                                    [...a.slice(0, i + 1), { ...a[i] }, ...a.slice(i + 1)])}>
                        ⧉
                      </ActionIcon>
                    </Tooltip>
                    <ActionIcon variant="subtle" color="red"
                                disabled={!editavel || itens.length === 1}
                                onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))}>
                      ✕
                    </ActionIcon>
                  </Group>
                </Grid.Col>
              </Grid>

              {/* Rastreabilidade: de qual lote a linha saiu. Aparece a partir
                  da confirmação — é o que responde "esse cliente levou qual
                  lote" num recall. */}
              {it.alocacoes?.length > 0 && (
                <Group gap="xs" mt="xs" align="center">
                  <Text size="xs" c="dimmed" fw={600} tt="uppercase">Sai de</Text>
                  {it.alocacoes.map((a, k) => (
                    <Badge key={k} variant="light" size="sm">
                      {a.lote} · {Number(a.quantidade)}
                      {a.dataValidade ? ` · val ${data(a.dataValidade)}` : ''}
                    </Badge>
                  ))}
                  {it.custoUnitarioBaixa != null && (
                    <Text size="xs" c="dimmed">custo {brl(it.custoUnitarioBaixa)}/un</Text>
                  )}
                </Group>
              )}
            </Card>
          ))}
        </Stack>

        <Button variant="light" size="xs" mt="sm" disabled={!editavel}
                onClick={() => setItens((a) => [...a, itemVazio()])}>+ Adicionar item</Button>
      </Card>

      <Card withBorder padding="lg">
        <Title order={4} mb="md">Totais</Title>
        <Group align="flex-end" gap="xl">
          <NumberInput label="Desconto do pedido" min={0} decimalScale={2} prefix="R$ " w={180}
                       value={form.descontoPedido} onChange={setF('descontoPedido')}
                       disabled={!editavel} />
          <Stat label="Valor bruto" value={brl(valorBruto)} />
          <Stat label="Desconto nos itens" value={brl(descontoItens)} />
          <Stat label="Desconto total" value={brl(descontoTotal)} />
          <Stat label="Valor líquido" value={brl(valorLiquido)}
                color={valorLiquido < 0 ? 'red' : undefined} />
        </Group>

        {editavel && (
          <>
            <Divider my="lg" />
            <Group>
              <Button size="md" loading={enviando} onClick={enviar}>
                {novo ? 'Criar pedido' : 'Salvar alterações'}
              </Button>
              <Button variant="default" onClick={() => navigate('/vendas')}>Voltar</Button>
            </Group>
          </>
        )}
        {!editavel && (
          <>
            <Divider my="lg" />
            <Button variant="default" onClick={() => navigate('/vendas')}>Voltar</Button>
          </>
        )}
      </Card>
    </Stack>
  )
}

function Stat({ label, value, color }) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text fw={600} c={color}>{value}</Text>
    </Stack>
  )
}
