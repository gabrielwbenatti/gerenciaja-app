import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, NavLink, Text, Button, Stack, Box } from '@mantine/core'
import { limparSessao } from '../sessao'

// Agrupado por domínio (Compras, Vendas, Estoque) e não por natureza da tela
// (cadastro x lançamento x consulta): é o eixo que continua fazendo sentido
// quando Financeiro e Fiscal entrarem. Por natureza, "lançamentos" viraria um
// balaio com metade do sistema dentro.
//
// Seções de um item só são deliberadas — Vendas ganha contas a receber e
// devolução, Estoque ganha ajuste e transferência. Agrupar agora evita
// remontar o menu depois.
const SECOES = [
  {
    titulo: 'Cadastros',
    itens: [
      { to: '/pessoas', label: 'Pessoas' },
      { to: '/produtos', label: 'Produtos' },
    ],
  },
  {
    titulo: 'Compras',
    itens: [
      { to: '/recebimento', label: 'Entrada de mercadoria' },
      { to: '/notas', label: 'Notas de entrada' },
    ],
  },
  {
    titulo: 'Vendas',
    itens: [
      { to: '/vendas', label: 'Pedidos de venda' },
    ],
  },
  {
    titulo: 'Estoque',
    itens: [
      { to: '/estoque', label: 'Saldos e extrato' },
    ],
  },
]

// Fora das seções: Início é a raiz e Configurações não pertence a domínio
// nenhum — fica junto do bloco da empresa, no rodapé.
const INICIO = { to: '/', label: 'Início', exact: true }
const CONFIGURACOES = { to: '/configuracoes', label: 'Configurações' }

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
          {/* minHeight 0 é o que faz o overflow valer: filho de flex não encolhe
              abaixo do próprio conteúdo sem isso, e o menu empurraria o rodapé
              (empresa/sair) para fora da tela em vez de rolar. Mesma lição do
              min-width registrada em MODELAGEM 10.1, no eixo vertical. */}
          <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <Text fw={700} size="xl" mb="md" px="xs">
              Gerencie<Text span c="blue" inherit>Já</Text>
            </Text>

            <NavLink component={Link} to={INICIO.to} label={INICIO.label}
                     active={ativo(INICIO)} />

            {/* Rótulos de seção, não acordeões: com oito telas, esconder item
                atrás de um clique custa mais do que economiza. Vira colapsável
                quando o menu passar de ~15 itens. */}
            {SECOES.map((secao) => (
              <Box key={secao.titulo} mt="md">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700} px="xs" mb={4}>
                  {secao.titulo}
                </Text>
                <Stack gap={2}>
                  {secao.itens.map((l) => (
                    <NavLink key={l.to} component={Link} to={l.to} label={l.label}
                             active={ativo(l)} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>

          <Box>
            <NavLink component={Link} to={CONFIGURACOES.to} label={CONFIGURACOES.label}
                     active={ativo(CONFIGURACOES)} mb="sm" />
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
