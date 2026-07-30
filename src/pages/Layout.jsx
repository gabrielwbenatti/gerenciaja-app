import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, NavLink, Text, Button, Stack, Box } from '@mantine/core'
import { limparSessao } from '../sessao'

const LINKS = [
  { to: '/', label: 'Início', exact: true },
  { to: '/pessoas', label: 'Pessoas' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/recebimento', label: 'Entrada de mercadoria' },
  { to: '/notas', label: 'Notas de entrada' },
  { to: '/vendas', label: 'Pedidos de venda' },
  { to: '/estoque', label: 'Estoque' },
  { to: '/configuracoes', label: 'Configurações' },
]

export default function Layout({ sessao, aoSair }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { empresa, usuario } = sessao

  function sair() {
    limparSessao()
    aoSair?.()
    navigate('/login')
  }

  const ativo = (l) => (l.exact ? pathname === l.to : pathname.startsWith(l.to))

  return (
    <AppShell navbar={{ width: 260, breakpoint: 'sm' }} padding="lg">
      <AppShell.Navbar p="md">
        <Stack justify="space-between" h="100%">
          <Box>
            <Text fw={700} size="xl" mb="md" px="xs">
              Gerencie<Text span c="blue" inherit>Já</Text>
            </Text>
            <Stack gap={2}>
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  component={Link}
                  to={l.to}
                  label={l.label}
                  active={ativo(l)}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Empresa</Text>
            <Text fw={600} size="sm">
              {empresa?.nomeFantasia || empresa?.razaoSocial}
            </Text>
            <Text size="xs" c="dimmed" mb="xs">{usuario?.nome}</Text>
            <Button variant="default" size="xs" fullWidth onClick={sair}>
              Sair
            </Button>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
