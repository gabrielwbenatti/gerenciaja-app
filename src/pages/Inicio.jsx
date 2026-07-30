import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Title, Text, SimpleGrid, Stack, Group, Loader, Center, Alert, Badge,
} from '@mantine/core'
import { api } from '../api'
import { PageHeader } from '../components/PageHeader'
import { GraficoBarras } from '../components/GraficoBarras'
import { formatDocument } from '../lib/format'

const REGIME_LABEL = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
}

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const mesAtual = () =>
  new Date().toLocaleDateString('pt-BR', { month: 'long' })

/**
 * Indicador numérico.
 *
 * `alerta` pinta o número e acrescenta um selo — a cor nunca carrega o aviso
 * sozinha, senão quem não distingue vermelho não vê que há algo errado.
 */
function Indicador({ label, valor, detalhe, alerta, aoClicar }) {
  return (
    <Card withBorder padding="md"
          style={aoClicar ? { cursor: 'pointer' } : undefined}
          onClick={aoClicar}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Group gap="xs" align="baseline" mt={4}>
        <Text fw={700} fz={26} c={alerta ? 'red.7' : undefined}>{valor}</Text>
        {alerta && <Badge color="red" variant="light" size="sm">atenção</Badge>}
      </Group>
      {detalhe && <Text size="sm" c="dimmed" mt={2}>{detalhe}</Text>}
    </Card>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text fw={500}>{value}</Text>
    </div>
  )
}

export default function Inicio({ empresa }) {
  const navigate = useNavigate()
  const [r, setResumo] = useState(null)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    api.get('/painel/resumo').then(setResumo).catch((e) => setErro(e.message))
  }, [])

  const regime = REGIME_LABEL[empresa?.regimeTributario] || empresa?.regimeTributario
  const totalFaturado = r?.faturamentoDiario?.reduce((s, p) => s + Number(p.valor), 0) ?? 0

  return (
    <Stack>
      <PageHeader title="Início" subtitle="Visão geral da empresa" />

      {erro && <Alert color="red">{erro}</Alert>}
      {!r && !erro && <Center p="xl"><Loader /></Center>}

      {r && (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            <Indicador
              label="Valor em estoque" valor={brl(r.valorEstoque)}
              detalhe={`${r.produtosAtivos} ${r.produtosAtivos === 1 ? 'produto' : 'produtos'}`}
              aoClicar={() => navigate('/estoque')}
            />
            <Indicador
              label="Pedidos em aberto" valor={r.pedidosEmAberto}
              detalhe={brl(r.valorPedidosEmAberto)}
              aoClicar={() => navigate('/vendas')}
            />
            <Indicador
              label="A pagar nesta semana" valor={brl(r.aPagarNaSemana)}
              detalhe={`${r.contasNaSemana} ${r.contasNaSemana === 1 ? 'conta' : 'contas'}`}
            />
            <Indicador
              label="Vencido" valor={brl(r.aPagarVencido)}
              detalhe={`${r.contasVencidas} ${r.contasVencidas === 1 ? 'conta' : 'contas'}`}
              alerta={r.contasVencidas > 0}
            />
            <Indicador
              label={`Faturado em ${mesAtual()}`} valor={brl(r.faturadoNoMes)}
              detalhe="Somente pedidos faturados"
            />
            <Indicador
              label="Clientes" valor={r.clientes}
              detalhe={`${r.fornecedores} ${r.fornecedores === 1 ? 'fornecedor' : 'fornecedores'}`}
              aoClicar={() => navigate('/pessoas')}
            />
            <Indicador
              label="Abaixo do mínimo" valor={r.produtosAbaixoDoMinimo}
              detalhe="Produtos com estoque mínimo configurado"
              alerta={r.produtosAbaixoDoMinimo > 0}
              aoClicar={() => navigate('/estoque')}
            />
          </SimpleGrid>

          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>Faturamento por dia</Title>
              <Text size="sm" c="dimmed">últimos 30 dias · {brl(totalFaturado)}</Text>
            </Group>
            {/* Sem faturamento, trinta barras zeradas não informam nada —
                melhor dizer o que falta acontecer. */}
            {totalFaturado > 0
              ? <GraficoBarras pontos={r.faturamentoDiario} />
              : (
                <Text c="dimmed" size="sm" py="xl" ta="center">
                  Nenhum pedido faturado nos últimos 30 dias. Assim que você faturar
                  um pedido de venda, o histórico aparece aqui.
                </Text>
              )}
          </Card>

          <Card withBorder padding="lg">
            <Title order={4} mb="md">{empresa?.razaoSocial}</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Info label="CNPJ" value={formatDocument(empresa?.cnpj)} />
              <Info label="Regime" value={regime} />
              <Info label="Depósito padrão" value={`#${empresa?.depositoPadraoId}`} />
            </SimpleGrid>
          </Card>
        </>
      )}
    </Stack>
  )
}
