import { useEffect, useMemo, useState } from 'react'
import {
  Card, TextInput, NumberInput, Button, ActionIcon, Grid, Group, Stack,
  Text, Title, Badge, Divider, Loader, Center, Alert,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { getEmpresa } from '../tenant'
import { PageHeader } from '../components/PageHeader'
import { ModalNovoProduto } from '../components/ModalNovoProduto'
import { ModalNovaPessoa } from '../components/ModalNovaPessoa'
import { SelectComCadastro } from '../components/SelectComCadastro'
import { formatDocument, normalizeBusca } from '../lib/format'

// Filtro que ignora formatação: "60575" acha "60.575...". Vale para nome e doc.
const filtroBusca = ({ options, search }) => {
  const q = normalizeBusca(search)
  if (!q) return options
  return options.filter((o) => o.label && normalizeBusca(o.label).includes(q))
}

const hoje = () => new Date().toISOString().slice(0, 10)
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const num = (v) => (v === '' || v == null ? 0 : Number(v))
const arred2 = (v) => Math.round(v * 100) / 100

const itemVazio = () => ({
  produtoId: '', quantidadeDeclarada: '', quantidadeRecebida: '',
  valorUnitario: '', loteCodigo: '', dataValidade: '',
})
const dupVazia = () => ({ numero: '', vencimento: '', valor: '' })

export default function Recebimento() {
  const empresa = getEmpresa()
  const [fornecedores, setFornecedores] = useState(null)
  const [produtos, setProdutos] = useState(null)
  const [erroCarga, setErroCarga] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/pessoas?papel=FORNECEDOR'), api.get('/produtos')])
      .then(([f, p]) => { setFornecedores(f); setProdutos(p) })
      .catch((e) => setErroCarga(e.message))
  }, [])

  if (erroCarga) return <Alert color="red">{erroCarga}</Alert>
  if (!fornecedores || !produtos) return <Center p="xl"><Loader /></Center>

  return (
    <Stack>
      <PageHeader title="Entrada de mercadoria"
        subtitle="Escrituração de NF-e: estoque, custo e contas a pagar em uma operação" />
      {fornecedores.length === 0 && (
        <Alert color="yellow">Cadastre ao menos um fornecedor em “Pessoas” antes de dar entrada.</Alert>
      )}
      {produtos.length === 0 && (
        <Alert color="yellow">Cadastre ao menos um produto antes de dar entrada.</Alert>
      )}
      <FormRecebimento empresa={empresa} fornecedores={fornecedores} setFornecedores={setFornecedores}
                       produtos={produtos} setProdutos={setProdutos} />
    </Stack>
  )
}

function FormRecebimento({ empresa, fornecedores, setFornecedores, produtos, setProdutos }) {
  const produtoPorId = useMemo(
    () => Object.fromEntries(produtos.map((p) => [String(p.id), p])), [produtos])
  const optFornecedores = useMemo(
    () => fornecedores.map((f) => ({ value: String(f.id), label: `${f.nome} — ${formatDocument(f.documento)}` })),
    [fornecedores])
  const optProdutos = useMemo(
    () => produtos.map((p) => ({ value: String(p.id), label: `${p.sku} — ${p.nome}` })), [produtos])

  const [fornecedorId, setFornecedorId] = useState('')
  const [nota, setNota] = useState({
    serie: '', numero: '', dataEmissao: hoje(), dataEntrada: hoje(),
    naturezaOperacao: 'Compra para revenda', valorFrete: '', valorDesconto: '', valorTotal: '',
  })
  const [itens, setItens] = useState([itemVazio()])
  const [duplicatas, setDuplicatas] = useState([dupVazia()])
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [chaveIdem] = useState(() => 'web-' + crypto.randomUUID())

  const setN = (campo) => (valor) => setNota((n) => ({ ...n, [campo]: valor }))
  function setItem(i, campo, valor) {
    setItens((arr) => arr.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)))
  }
  function produtoCriado(i, produto) {
    setProdutos((lista) => [...lista, produto])
    setItem(i, 'produtoId', String(produto.id))
  }
  function fornecedorCriado(pessoa) {
    setFornecedores((lista) => [...lista, pessoa])
    setFornecedorId(String(pessoa.id))
  }
  const totalItem = (it) => arred2(num(it.quantidadeDeclarada) * num(it.valorUnitario))

  const somaItens = arred2(itens.reduce((s, it) => s + totalItem(it), 0))
  const totalSugerido = arred2(somaItens + num(nota.valorFrete) - num(nota.valorDesconto))
  const somaDuplicatas = arred2(duplicatas.reduce((s, d) => s + num(d.valor), 0))
  const totalNota = num(nota.valorTotal)
  const naoCobrado = arred2(totalNota - somaDuplicatas)
  const duplicatasValidas = totalNota > 0 && somaDuplicatas <= arred2(totalNota)

  async function enviar() {
    if (!fornecedorId) return notifications.show({ color: 'red', message: 'Selecione o fornecedor.' })
    if (itens.some((it) => !it.produtoId))
      return notifications.show({ color: 'red', message: 'Todo item precisa de um produto.' })
    for (const it of itens) {
      const prod = produtoPorId[it.produtoId]
      if (prod?.controlaLote && !it.loteCodigo.trim())
        return notifications.show({ color: 'red', message: `${prod.sku} controla lote — informe o código.` })
    }
    if (!duplicatasValidas)
      return notifications.show({ color: 'red', message: `Duplicatas (${brl(somaDuplicatas)}) passam do total (${brl(totalNota)}).` })

    const comando = {
      fornecedorId: Number(fornecedorId),
      depositoId: empresa.depositoPadraoId,
      chaveIdempotencia: chaveIdem,
      nota: {
        modelo: '55', serie: nota.serie, numero: nota.numero,
        dataEmissao: nota.dataEmissao, dataEntrada: nota.dataEntrada,
        naturezaOperacao: nota.naturezaOperacao,
        valorFrete: num(nota.valorFrete), valorSeguro: 0, valorOutrasDespesas: 0,
        valorDesconto: num(nota.valorDesconto), valorTotal: num(nota.valorTotal),
      },
      itens: itens.map((it) => ({
        produtoId: Number(it.produtoId),
        quantidadeDeclarada: num(it.quantidadeDeclarada),
        quantidadeRecebida: num(it.quantidadeRecebida),
        valorUnitario: num(it.valorUnitario),
        valorTotal: totalItem(it),
        loteCodigo: it.loteCodigo || null,
        dataValidade: it.dataValidade || null,
      })),
      duplicatas: duplicatas.map((d) => ({ numero: d.numero, vencimento: d.vencimento, valor: num(d.valor) })),
    }

    setEnviando(true)
    try {
      const r = await api.post('/recebimentos', comando)
      setResultado(r)
      notifications.show({ color: 'green', message: 'Entrada registrada.' })
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao registrar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  if (resultado) {
    return (
      <Card withBorder padding="lg">
        <Alert color={resultado.comDivergencia ? 'yellow' : 'green'}
               title={resultado.jaEscriturada ? 'Nota já escriturada (reenvio)' : 'Entrada registrada com sucesso'}>
          <Stack gap={4}>
            <Text size="sm">Nota fiscal #{resultado.notaFiscalEntradaId}</Text>
            <Text size="sm">Recebimento #{resultado.recebimentoId}</Text>
            <Text size="sm">Contas a pagar: {resultado.contasPagarIds.join(', ') || '—'}</Text>
            <Text size="sm">Movimentos de estoque: {resultado.movimentosEstoqueIds.join(', ') || '—'}</Text>
            {resultado.comDivergencia && (
              <Text size="sm" fw={500}>⚠ Há divergência entre declarado e recebido — registrada como ocorrência.</Text>
            )}
          </Stack>
        </Alert>
        <Button mt="md" onClick={() => window.location.reload()}>Nova entrada</Button>
      </Card>
    )
  }

  return (
    <Stack>
      <Card withBorder padding="lg">
        <Title order={4} mb="md">Nota fiscal</Title>
        <Stack>
          <SelectComCadastro label="Fornecedor" withAsterisk searchable data={optFornecedores}
                  value={fornecedorId} onChange={setFornecedorId} filter={filtroBusca}
                  placeholder="Buscar por nome ou CNPJ…" nothingFoundMessage="Nada encontrado"
                  modal={ModalNovaPessoa} onCriado={fornecedorCriado}
                  modalProps={{ papeisIniciais: ['FORNECEDOR'], title: 'Novo fornecedor' }} />
          <Group grow>
            <TextInput label="Série" withAsterisk value={nota.serie}
                       onChange={(e) => setN('serie')(e.currentTarget.value)} />
            <TextInput label="Número" withAsterisk value={nota.numero}
                       onChange={(e) => setN('numero')(e.currentTarget.value)} />
            <TextInput label="Emissão" type="date" value={nota.dataEmissao}
                       onChange={(e) => setN('dataEmissao')(e.currentTarget.value)} />
            <TextInput label="Entrada" type="date" value={nota.dataEntrada}
                       onChange={(e) => setN('dataEntrada')(e.currentTarget.value)} />
          </Group>
          <Group grow>
            <NumberInput label="Frete" min={0} decimalScale={2} prefix="R$ "
                         value={nota.valorFrete} onChange={setN('valorFrete')} />
            <NumberInput label="Desconto" min={0} decimalScale={2} prefix="R$ "
                         value={nota.valorDesconto} onChange={setN('valorDesconto')} />
          </Group>
        </Stack>
      </Card>

      <Card withBorder padding="lg">
        <Title order={4} mb="md">Itens</Title>
        <Stack gap="sm">
          {itens.map((it, i) => {
            const controla = produtoPorId[it.produtoId]?.controlaLote
            return (
              <Card key={i} withBorder padding="sm" bg="var(--mantine-color-gray-0)">
                <Grid align="flex-end" gutter="xs">
                  <Grid.Col span={{ base: 12, md: controla ? 4 : 5 }}>
                    <SelectComCadastro label="Produto" searchable data={optProdutos} filter={filtroBusca}
                            value={it.produtoId || null}
                            onChange={(v) => setItem(i, 'produtoId', v || '')}
                            placeholder="Buscar produto…" nothingFoundMessage="Nada encontrado"
                            modal={ModalNovoProduto} onCriado={(produto) => produtoCriado(i, produto)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 4, md: 2 }}>
                    <NumberInput label="Qtd. nota" min={0} decimalScale={3} value={it.quantidadeDeclarada}
                                 onChange={(v) => {
                                   setItem(i, 'quantidadeDeclarada', v)
                                   if (it.quantidadeRecebida === '' || it.quantidadeRecebida === it.quantidadeDeclarada)
                                     setItem(i, 'quantidadeRecebida', v)
                                 }} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 4, md: 2 }}>
                    <NumberInput label="Qtd. recebida" min={0} decimalScale={3}
                                 value={it.quantidadeRecebida}
                                 onChange={(v) => setItem(i, 'quantidadeRecebida', v)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 4, md: 2 }}>
                    <NumberInput label="Vlr. unit." min={0} decimalScale={4} prefix="R$ "
                                 value={it.valorUnitario}
                                 onChange={(v) => setItem(i, 'valorUnitario', v)} />
                  </Grid.Col>
                  {controla && (
                    <>
                      <Grid.Col span={{ base: 6, md: 1.5 }}>
                        <TextInput label="Lote" value={it.loteCodigo}
                                   onChange={(e) => setItem(i, 'loteCodigo', e.currentTarget.value)} />
                      </Grid.Col>
                      <Grid.Col span={{ base: 6, md: 2 }}>
                        <TextInput label="Validade" type="date" value={it.dataValidade}
                                   onChange={(e) => setItem(i, 'dataValidade', e.currentTarget.value)} />
                      </Grid.Col>
                    </>
                  )}
                  <Grid.Col span={{ base: 12, md: controla ? 12 : 1 }}>
                    <Group justify="flex-end">
                      <ActionIcon variant="subtle" color="red" disabled={itens.length === 1}
                                  onClick={() => setItens((a) => a.filter((_, idx) => idx !== i))}>
                        ✕
                      </ActionIcon>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Card>
            )
          })}
        </Stack>
        <Button variant="light" size="xs" mt="sm"
                onClick={() => setItens((a) => [...a, itemVazio()])}>+ Adicionar item</Button>
      </Card>

      <Card withBorder padding="lg">
        <Title order={4} mb="md">Total e pagamento</Title>
        <Group gap="xl">
          <Stat label="Soma dos itens" value={brl(somaItens)} />
          <Stat label="+ Frete − Desconto" value={brl(totalSugerido)} />
          <Group gap="xs" align="flex-end">
            <NumberInput label="Total da nota" withAsterisk min={0} decimalScale={2} prefix="R$ " w={160}
                         value={nota.valorTotal} onChange={setN('valorTotal')} />
            <Button variant="light" size="sm"
                    onClick={() => setN('valorTotal')(totalSugerido)}>usar {brl(totalSugerido)}</Button>
          </Group>
        </Group>

        <Divider my="lg" label="Duplicatas (parcelas a pagar)" labelPosition="left" />
        <Stack gap="xs">
          {duplicatas.map((d, i) => (
            <Group key={i} align="flex-end" wrap="nowrap">
              <Group grow align="flex-end" style={{ flex: 1 }}>
                <TextInput label="Número" value={d.numero}
                           onChange={(e) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, numero: e.currentTarget.value } : x))} />
                <TextInput label="Vencimento" type="date" value={d.vencimento}
                           onChange={(e) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, vencimento: e.currentTarget.value } : x))} />
                <NumberInput label="Valor" min={0} decimalScale={2} prefix="R$ " value={d.valor}
                             onChange={(v) => setDuplicatas((a) => a.map((x, idx) => idx === i ? { ...x, valor: v } : x))} />
              </Group>
              <ActionIcon variant="subtle" color="red" mb={4} disabled={duplicatas.length === 1}
                          onClick={() => setDuplicatas((a) => a.filter((_, idx) => idx !== i))}>✕</ActionIcon>
            </Group>
          ))}
        </Stack>
        <Button variant="light" size="xs" mt="sm"
                onClick={() => setDuplicatas((a) => [...a, dupVazia()])}>+ Adicionar parcela</Button>

        <Group gap="xl" mt="lg">
          <Stat label="Soma das parcelas" value={brl(somaDuplicatas)} />
          <Stat label="Não cobrado (bonificação/desconto)" value={brl(naoCobrado)} />
          <Stat label="Situação"
                value={!duplicatasValidas ? '✗ parcelas passam do total'
                  : naoCobrado > 0 ? '✓ com bonificação/desconto' : '✓ ok'}
                color={duplicatasValidas ? 'green' : 'red'} />
        </Group>
      </Card>

      <Group>
        <Button size="md" loading={enviando} onClick={enviar}>Registrar entrada</Button>
      </Group>
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
