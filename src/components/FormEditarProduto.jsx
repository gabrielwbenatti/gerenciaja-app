import { useState } from 'react'
import { TextInput, Textarea, NumberInput, Select, Switch, Text, Group, Stack, Button, Badge } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { UNIDADES } from '../lib/catalogo'

/**
 * Edicao de produto ja cadastrado. SKU e controle de lote nao aparecem como
 * campos porque a API nao aceita mudar nenhum dos dois depois da criacao
 * (ver CatalogoService.atualizarProduto e CatalogoDtos.AtualizarProduto no
 * backend): SKU e' a chave que todo o sistema referencia, e alternar controle
 * de lote depois que ja existem lotes/movimentos quebraria o rastreio.
 *
 * aoSalvar recebe o ProdutoResposta atualizado.
 */
export function FormEditarProduto({ produto, aoSalvar }) {
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      codigoBarras: produto.codigoBarras ?? '',
      unidadeMedida: produto.unidadeMedida,
      precoVenda: produto.precoVenda ?? 0,
      estoqueMinimo: produto.estoqueMinimo ?? 0,
      controlaEstoque: produto.controlaEstoque !== false,
      ncm: produto.dadosFiscais?.ncm ?? '',
    },
    validate: {
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
    },
  })

  async function enviar(values) {
    setEnviando(true)
    try {
      const atualizado = await api.put(`/produtos/${produto.id}`, {
        nome: values.nome,
        descricao: values.descricao || null,
        codigoBarras: values.codigoBarras || null,
        unidadeMedida: values.unidadeMedida,
        precoVenda: values.precoVenda === '' ? 0 : Number(values.precoVenda),
        estoqueMinimo: values.estoqueMinimo === '' ? 0 : Number(values.estoqueMinimo),
        controlaEstoque: values.controlaEstoque,
        dadosFiscais: values.ncm ? { ncm: values.ncm } : null,
      })
      notifications.show({ color: 'green', message: `${values.nome} atualizado.` })
      aoSalvar(atualizado)
    } catch (err) {
      notifications.show({ color: 'red', title: 'Erro ao salvar', message: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit(enviar)}>
      <Stack>
        <Group grow align="flex-end">
          <TextInput label="SKU" value={produto.sku} disabled
                     description="Não pode ser alterado depois de criado" />
          <TextInput label="Código de barras (EAN)" {...form.getInputProps('codigoBarras')} />
        </Group>
        <TextInput label="Nome" withAsterisk data-autofocus {...form.getInputProps('nome')} />
        <Textarea label="Descrição" autosize minRows={2} {...form.getInputProps('descricao')} />
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
                       disabled={!form.values.controlaEstoque}
                       {...form.getInputProps('estoqueMinimo')} />
        </Group>
        <Switch label="Este produto controla estoque"
                description="Desligue para serviço, frete ou taxa. Só é possível desligar enquanto o produto nunca movimentou."
                {...form.getInputProps('controlaEstoque', { type: 'checkbox' })} />
        {form.values.controlaEstoque && (
          <div>
            <Text size="sm" fw={500} mb={4}>Controle de lote e validade</Text>
            <Badge variant="light" color={produto.controlaLote ? 'blue' : 'gray'}>
              {produto.controlaLote ? 'Controla lote' : 'Não controla lote'}
            </Badge>
            <Text size="xs" c="dimmed" mt={4}>
              Não pode ser alterado depois de criado — já existem lotes/movimentos vinculados a esta configuração.
            </Text>
          </div>
        )}
        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar alterações</Button>
        </Group>
      </Stack>
    </form>
  )
}
