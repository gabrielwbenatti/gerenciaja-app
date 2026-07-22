import { useState } from 'react'
import { Select, Text } from '@mantine/core'

const VALOR_CRIAR = '__criar__'

/**
 * Select com cadastro rapido embutido como opcao da propria lista (ultimo
 * item, sempre visivel), em vez de um botao ao lado -- nao altera a altura do
 * campo nem desalinha Grid.Col vizinhos, e aparece justo quando a busca nao
 * acha o que o usuario quer.
 *
 * `modal` recebe qualquer componente no formato { opened, onClose, onCriado }
 * (ex.: ModalNovoProduto, ModalNovaPessoa). `onCriado` repassa o item criado
 * para quem chamou decidir como adicionar na lista e selecionar -- este
 * componente nao guarda estado de lista, so o do modal e o texto de busca.
 *
 * `modalProps` repassa props extras direto pro modal (ex.: `papeisIniciais`
 * e `title` do ModalNovaPessoa), sem este componente precisar conhecer o
 * formato de cada modal especifico.
 */
export function SelectComCadastro({
  data, filter, modal: ModalCadastro, modalProps, onCriado, textoNovo = 'Cadastrar novo', onChange, ...props
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const rotuloCriar = busca.trim() ? `+ Cadastrar "${busca.trim()}"` : `+ ${textoNovo}`
  const dataComCriar = [...data, { value: VALOR_CRIAR, label: rotuloCriar }]

  function filtroComCriar({ options, search }) {
    const semCriar = options.filter((o) => o.value !== VALOR_CRIAR)
    const criar = options.find((o) => o.value === VALOR_CRIAR)
    const filtradas = filter ? filter({ options: semCriar, search }) : semCriar
    return criar ? [...filtradas, criar] : filtradas
  }

  function handleChange(v) {
    if (v === VALOR_CRIAR) {
      setAberto(true)
      return
    }
    onChange?.(v)
  }

  return (
    <>
      <Select
        {...props}
        data={dataComCriar}
        filter={filtroComCriar}
        searchValue={busca}
        onSearchChange={setBusca}
        onChange={handleChange}
        renderOption={({ option }) =>
          option.value === VALOR_CRIAR
            ? <Text c="blue" fw={500}>{option.label}</Text>
            : option.label
        }
      />
      {ModalCadastro && (
        <ModalCadastro
          {...modalProps}
          opened={aberto}
          onClose={() => setAberto(false)}
          nomeInicial={busca.trim()}
          onCriado={(item) => { setAberto(false); setBusca(''); onCriado?.(item) }}
        />
      )}
    </>
  )
}
