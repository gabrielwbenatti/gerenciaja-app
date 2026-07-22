import { useState } from 'react'
import { TextInput, NumberInput, Select, Switch, Group, Stack, Button } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { api } from '../api'

const UNIDADES = ['UN', 'KG', 'G', 'CX', 'L', 'ML', 'M', 'M2', 'M3', 'PC']

/**
 * Formulario de cadastro de produto. Compartilhado entre a tela de Produtos
 * e o cadastro rapido acionado a partir de outras telas (ver ModalNovoProduto).
 *
 * aoSalvar recebe o ProdutoResposta criado pela API, para quem chamou poder
 * usar o id sem precisar recarregar a lista inteira.
 */
export function FormProduto({ aoSalvar, skuInicial = '', nomeInicial = '' }) {
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      sku: skuInicial, nome: nomeInicial, codigoBarras: '', unidadeMedida: 'UN',
      precoVenda: '', estoqueMinimo: '', controlaLote: false, ncm: '',
    },
    validate: {
      sku: (v) => (v.trim() ? null : 'Informe o SKU'),
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
    },
  })

  async function enviar(values) {
    setEnviando(true)
    try {
      const produto = await api.post('/produtos', {
        sku: values.sku,
        nome: values.nome,
        codigoBarras: values.codigoBarras || null,
        unidadeMedida: values.unidadeMedida,
        precoVenda: values.precoVenda === '' ? 0 : Number(values.precoVenda),
        estoqueMinimo: values.estoqueMinimo === '' ? 0 : Number(values.estoqueMinimo),
        controlaLote: values.controlaLote,
        dadosFiscais: values.ncm ? { ncm: values.ncm } : null,
      })
      notifications.show({ color: 'green', message: `${values.nome} cadastrado.` })
      aoSalvar(produto)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Group grow>
          <TextInput label="SKU" withAsterisk data-autofocus placeholder="ARROZ-5KG"
                     {...form.getInputProps('sku')} />
          <TextInput label="Código de barras (EAN)" {...form.getInputProps('codigoBarras')} />
        </Group>
        <TextInput label="Nome" withAsterisk {...form.getInputProps('nome')} />
        <Group grow>
          <Select label="Unidade" data={UNIDADES} allowDeselect={false}
                  {...form.getInputProps('unidadeMedida')} />
          <TextInput label="NCM" maxLength={8} placeholder="opcional — usado na NF-e"
                     {...form.getInputProps('ncm')} />
        </Group>
        <Group grow>
          <NumberInput label="Preço de venda" min={0} decimalScale={2} prefix="R$ "
                       thousandSeparator="." decimalSeparator=","
                       {...form.getInputProps('precoVenda')} />
          <NumberInput label="Estoque mínimo" min={0} decimalScale={3}
                       {...form.getInputProps('estoqueMinimo')} />
        </Group>
        <Switch label="Este produto controla lote e validade"
                description="Para alimentos, cosméticos, medicamentos"
                {...form.getInputProps('controlaLote', { type: 'checkbox' })} />
        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar</Button>
        </Group>
      </Stack>
    </form>
  )
}
