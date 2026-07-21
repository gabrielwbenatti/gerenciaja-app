import { createTheme } from '@mantine/core'

// Tema central do app. Cores, raio, fonte e defaults de componentes ficam aqui,
// para que padronização de estilo seja um lugar só.
export const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  headings: { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
})
