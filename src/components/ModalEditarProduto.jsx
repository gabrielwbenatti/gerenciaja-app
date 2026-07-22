import { Modal } from '@mantine/core'
import { FormEditarProduto } from './FormEditarProduto'

/**
 * Edicao de produto em modal. `produto` e o ProdutoResposta a editar; passar
 * null/undefined mantem o modal fechado (nao ha estado de "editando" proprio
 * aqui, so o que quem chamou repassa).
 *
 * onSalvo recebe o ProdutoResposta atualizado.
 */
export function ModalEditarProduto({ produto, opened, onClose, onSalvo }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Editar produto" size="lg">
      {produto && (
        <FormEditarProduto
          produto={produto}
          aoSalvar={(atualizado) => {
            onClose()
            onSalvo?.(atualizado)
          }}
        />
      )}
    </Modal>
  )
}
