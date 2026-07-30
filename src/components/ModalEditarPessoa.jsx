import { Modal } from '@mantine/core'
import { FormEditarPessoa } from './FormEditarPessoa'

/**
 * Edição de pessoa em modal, espelhando ModalEditarProduto.
 *
 * `pessoa` nulo mantém o modal fechado — quem chama guarda a pessoa em edição
 * no próprio estado e a limpa ao fechar.
 */
export function ModalEditarPessoa({ pessoa, onClose, onSalvo }) {
  return (
    <Modal opened={!!pessoa} onClose={onClose}
           title={pessoa ? `Editar ${pessoa.nome}` : 'Editar pessoa'} size="lg">
      {pessoa && (
        <FormEditarPessoa
          pessoa={pessoa}
          aoSalvar={(atualizada) => {
            onClose()
            onSalvo?.(atualizada)
          }}
        />
      )}
    </Modal>
  )
}
