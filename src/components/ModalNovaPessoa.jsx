import { Modal } from '@mantine/core'
import { FormPessoa } from './FormPessoa'

/**
 * Cadastro rapido de pessoa em modal — para telas que precisam criar um
 * cliente/fornecedor/etc. sem interromper o fluxo atual (ex.: fornecedor sem
 * cadastro previo durante a entrada de mercadoria).
 *
 * onCriado recebe o PessoaResposta criado; quem chamou decide o que fazer com
 * ele (adicionar na lista local, selecionar no campo em edição, etc.).
 * `papeisIniciais` marca o(s) papel(eis) ja selecionado(s) no form -- ajuste
 * pelo contexto de quem abre o modal (ex.: FORNECEDOR a partir de Recebimento).
 */
export function ModalNovaPessoa({ opened, onClose, onCriado, nomeInicial, papeisIniciais, title = 'Nova pessoa' }) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="lg">
      <FormPessoa
        nomeInicial={nomeInicial}
        papeisIniciais={papeisIniciais}
        aoSalvar={(pessoa) => {
          onClose()
          onCriado?.(pessoa)
        }}
      />
    </Modal>
  )
}
