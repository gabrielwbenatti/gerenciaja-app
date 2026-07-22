import { useState } from 'react'
import { TextInput, Select, Chip, Group, Stack, Text, Button } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { getEmpresa } from '../tenant'
import { maskDocument, limparDocumento } from '../lib/format'

const PAPEIS = ['CLIENTE', 'FORNECEDOR', 'TRANSPORTADORA', 'VENDEDOR']

// Empresa exige documento? undefined (empresa antiga no localStorage) => exige.
const exigeDocumento = () => getEmpresa()?.documentoPessoaObrigatorio !== false

/**
 * Formulario de cadastro de pessoa. Compartilhado entre a tela de Pessoas e o
 * cadastro rapido acionado a partir de outras telas (ver ModalNovaPessoa).
 *
 * aoSalvar recebe o PessoaResposta criado pela API, para quem chamou poder
 * usar o id sem precisar recarregar a lista inteira.
 */
export function FormPessoa({ aoSalvar, nomeInicial = '', papeisIniciais = ['CLIENTE'] }) {
  const [enviando, setEnviando] = useState(false)
  const documentoObrigatorio = exigeDocumento()

  const form = useForm({
    initialValues: {
      tipo: 'PJ', documento: '', nome: nomeInicial, nomeFantasia: '',
      papeis: papeisIniciais, email: '', telefone: '',
    },
    validate: {
      documento: (v, values) => {
        const n = limparDocumento(v).length
        // Vazio só é válido se a empresa não exige documento.
        if (n === 0) return documentoObrigatorio ? 'Informe o CPF/CNPJ' : null
        const esperado = values.tipo === 'PF' ? 11 : 14
        return n === esperado ? null : `${values.tipo === 'PF' ? 'CPF' : 'CNPJ'} incompleto`
      },
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
      papeis: (v) => (v.length ? null : 'Selecione ao menos um papel'),
    },
  })

  // Máscara + detecção de PF/PJ pelo tamanho (o Select ainda permite ajuste manual).
  function onDocumento(e) {
    const mascarado = maskDocument(e.currentTarget.value)
    const qtd = limparDocumento(mascarado).length
    form.setFieldValue('documento', mascarado)
    if (qtd >= 12) form.setFieldValue('tipo', 'PJ')
    else if (qtd === 11) form.setFieldValue('tipo', 'PF')
  }

  async function enviar(values) {
    setEnviando(true)
    try {
      const corpo = { ...values }
      if (!corpo.email) delete corpo.email
      const pessoa = await api.post('/pessoas', corpo)
      notifications.show({ color: 'green', message: `${values.nome} cadastrado(a).` })
      aoSalvar(pessoa)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Group grow align="flex-start">
          <TextInput label="CPF / CNPJ" withAsterisk={documentoObrigatorio} data-autofocus
                     placeholder="CPF (11 dígitos) ou CNPJ (14)"
                     value={form.values.documento} onChange={onDocumento}
                     error={form.errors.documento} />
          <Select label="Tipo" data={[
                    { value: 'PJ', label: 'Pessoa Jurídica' },
                    { value: 'PF', label: 'Pessoa Física' },
                  ]} allowDeselect={false} {...form.getInputProps('tipo')} />
        </Group>
        <TextInput label="Nome / Razão social" withAsterisk {...form.getInputProps('nome')} />
        <Group grow>
          <TextInput label="Nome fantasia" {...form.getInputProps('nomeFantasia')} />
          <TextInput label="E-mail" type="email" {...form.getInputProps('email')} />
        </Group>
        <TextInput label="Telefone" {...form.getInputProps('telefone')} />

        <div>
          <Text size="sm" fw={500} mb={4}>Papéis <Text span c="red">*</Text></Text>
          <Chip.Group multiple value={form.values.papeis}
                      onChange={(v) => form.setFieldValue('papeis', v)}>
            <Group gap="xs">
              {PAPEIS.map((p) => <Chip key={p} value={p}>{p}</Chip>)}
            </Group>
          </Chip.Group>
          {form.errors.papeis && <Text c="red" size="xs" mt={4}>{form.errors.papeis}</Text>}
        </div>

        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar</Button>
        </Group>
      </Stack>
    </form>
  )
}
