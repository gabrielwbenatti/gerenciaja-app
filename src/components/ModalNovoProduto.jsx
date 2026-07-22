import { Modal } from '@mantine/core'
import { FormProduto } from './FormProduto'

/**
 * Cadastro rapido de produto em modal — para telas que precisam criar um
 * produto sem interromper o fluxo atual (ex.: item de nota sem cadastro
 * previo durante a entrada de mercadoria).
 *
 * onCriado recebe o ProdutoResposta criado; quem chamou decide o que fazer
 * com ele (adicionar na lista local, selecionar no item em edição, etc.).
 */
export function ModalNovoProduto({ opened, onClose, onCriado, skuInicial, nomeInicial }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Novo produto" size="lg">
      <FormProduto
        skuInicial={skuInicial}
        nomeInicial={nomeInicial}
        aoSalvar={(produto) => {
          onClose()
          onCriado?.(produto)
        }}
      />
    </Modal>
  )
}
