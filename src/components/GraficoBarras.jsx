import { useState } from 'react'
import { Box, Text } from '@mantine/core'

/**
 * Barras verticais para uma série diária. SVG inline, sem biblioteca de
 * gráficos: são barras simples, e o bundle já está em 600 kB.
 *
 * Uma série só, então não há legenda — o título do cartão nomeia o dado.
 * A cor (#228be6, o azul primário do tema) foi validada contra a superfície
 * clara: faixa de luminosidade, piso de croma e contraste ≥ 3:1.
 */

const COR = '#228be6'
const COR_ATIVA = '#1971c2'

// Espaço de desenho. O SVG escala proporcionalmente (sem preserveAspectRatio
// "none"), senão o arredondamento das pontas esticaria junto com a largura.
const L = 640
const A = 180
const MARGEM = { esq: 52, dir: 8, topo: 10, base: 24 }
const RAIO = 4
const VAO = 2 // respiro entre barras vizinhas

const brlCurto = (v) => {
  if (v >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}
const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
const diaCurto = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

/** Barra com o topo arredondado e a base encostada no eixo. */
function caminhoBarra(x, y, largura, altura) {
  const r = Math.min(RAIO, largura / 2, altura)
  const base = y + altura
  return `M ${x} ${base} V ${y + r} Q ${x} ${y} ${x + r} ${y} `
       + `H ${x + largura - r} Q ${x + largura} ${y} ${x + largura} ${y + r} `
       + `V ${base} Z`
}

export function GraficoBarras({ pontos }) {
  const [ativo, setAtivo] = useState(null)

  const maximo = Math.max(...pontos.map((p) => Number(p.valor) || 0))
  const larguraPlot = L - MARGEM.esq - MARGEM.dir
  const alturaPlot = A - MARGEM.topo - MARGEM.base
  const fatia = larguraPlot / pontos.length
  const larguraBarra = Math.max(1, fatia - VAO)
  const baseY = MARGEM.topo + alturaPlot

  const alturaDe = (v) => (maximo > 0 ? (Number(v) / maximo) * alturaPlot : 0)

  // Rótulos só nas pontas e no meio: trinta datas colidiriam.
  const indicesRotulo = [0, Math.floor(pontos.length / 2), pontos.length - 1]

  return (
    <Box style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${L} ${A}`} width="100%" height="auto" role="img"
           aria-label="Faturamento por dia nos últimos 30 dias">
        {/* Grade recessiva: zero, metade e topo. */}
        {[0, 0.5, 1].map((f) => {
          const y = baseY - f * alturaPlot
          return (
            <g key={f}>
              <line x1={MARGEM.esq} y1={y} x2={L - MARGEM.dir} y2={y}
                    stroke="var(--mantine-color-gray-3)" strokeWidth="1" />
              <text x={MARGEM.esq - 8} y={y + 3} textAnchor="end" fontSize="9"
                    fill="var(--mantine-color-dimmed)">
                {brlCurto(maximo * f)}
              </text>
            </g>
          )
        })}

        {pontos.map((p, i) => {
          const altura = alturaDe(p.valor)
          const x = MARGEM.esq + i * fatia + VAO / 2
          return (
            <g key={p.dia}>
              {altura > 0 && (
                <path d={caminhoBarra(x, baseY - altura, larguraBarra, altura)}
                      fill={ativo === i ? COR_ATIVA : COR} />
              )}
              {/* Alvo de hover maior que a marca, cobrindo a coluna inteira. */}
              <rect x={MARGEM.esq + i * fatia} y={MARGEM.topo}
                    width={fatia} height={alturaPlot} fill="transparent"
                    onMouseEnter={() => setAtivo(i)} onMouseLeave={() => setAtivo(null)} />
            </g>
          )
        })}

        {indicesRotulo.map((i) => (
          <text key={i} x={MARGEM.esq + i * fatia + fatia / 2} y={A - 8}
                textAnchor="middle" fontSize="9" fill="var(--mantine-color-dimmed)">
            {diaCurto(pontos[i].dia)}
          </text>
        ))}
      </svg>

      {ativo !== null && (
        <Box
          style={{
            position: 'absolute', top: 0,
            // Ancora à esquerda ou à direita conforme a metade, para o balão
            // não sair do cartão nas pontas.
            left: ativo < pontos.length / 2 ? `${(ativo / pontos.length) * 100}%` : undefined,
            right: ativo >= pontos.length / 2
              ? `${((pontos.length - 1 - ativo) / pontos.length) * 100}%` : undefined,
            background: 'var(--mantine-color-body)',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 6, padding: '4px 8px', pointerEvents: 'none',
            boxShadow: 'var(--mantine-shadow-sm)', whiteSpace: 'nowrap',
          }}
        >
          <Text size="xs" c="dimmed">{diaCurto(pontos[ativo].dia)}</Text>
          <Text size="sm" fw={600}>{brl(pontos[ativo].valor)}</Text>
        </Box>
      )}
    </Box>
  )
}
