import { Group, Title, Text, Stack } from '@mantine/core'

/** Cabeçalho padrão de página: título, subtítulo e uma ação opcional à direita. */
export function PageHeader({ title, subtitle, action }) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" wrap="nowrap">
      <Stack gap={2}>
        <Title order={2}>{title}</Title>
        {subtitle && <Text c="dimmed" size="sm">{subtitle}</Text>}
      </Stack>
      {action}
    </Group>
  )
}
