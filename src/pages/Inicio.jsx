import { Card, Title, Text, SimpleGrid, Stack } from '@mantine/core'
import { PageHeader } from '../components/PageHeader'
import { formatDocument } from '../lib/format'

const REGIME_LABEL = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
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
  const regime = REGIME_LABEL[empresa?.regimeTributario] || empresa?.regimeTributario

  return (
    <Stack>
      <PageHeader title="Início" subtitle="Visão geral da empresa" />

      <Card withBorder padding="lg">
        <Title order={4} mb="md">{empresa?.razaoSocial}</Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Info label="CNPJ" value={formatDocument(empresa?.cnpj)} />
          <Info label="Regime" value={regime} />
          <Info label="Depósito padrão" value={`#${empresa?.depositoPadraoId}`} />
        </SimpleGrid>
      </Card>

      <Card withBorder padding="lg">
        <Title order={4} mb="sm">Como está o sistema</Title>
        <Text c="dimmed" size="sm">
          Já funcionam: cadastro de <b>pessoas</b> (clientes e fornecedores) e de{' '}
          <b>produtos</b> (com e sem controle de lote), <b>entrada de mercadoria</b> por
          nota fiscal, consulta de <b>notas</b> e <b>estoque</b> com extrato.
        </Text>
      </Card>
    </Stack>
  )
}
