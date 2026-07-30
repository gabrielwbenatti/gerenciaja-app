import { TextInput, Select, Group, Stack } from '@mantine/core'
import { UFS, mascararCep } from '../lib/endereco'

/**
 * Bloco de endereço, compartilhado entre o cadastro e a edição de pessoa.
 * As regras (o que é obrigatório, como vira corpo de API) ficam em lib/endereco.
 */
export function CamposEndereco({ form }) {
  return (
    <Stack>
      <Group grow align="flex-start">
        <TextInput label="CEP" placeholder="00000-000" maxLength={9}
                   value={form.values.cep}
                   onChange={(e) => form.setFieldValue('cep', mascararCep(e.currentTarget.value))} />
        <TextInput label="Logradouro" {...form.getInputProps('logradouro')} />
      </Group>
      <Group grow align="flex-start">
        <TextInput label="Número" {...form.getInputProps('numero')} />
        <TextInput label="Complemento" {...form.getInputProps('complemento')} />
        <TextInput label="Bairro" {...form.getInputProps('bairro')} />
      </Group>
      <Group grow align="flex-start">
        <TextInput label="Cidade" {...form.getInputProps('cidade')} />
        <Select label="UF" data={UFS} searchable clearable {...form.getInputProps('uf')} />
        {/* A NF-e exige o código do município; coletar agora evita recadastro
            em massa quando o fiscal entrar. */}
        <TextInput label="Código IBGE" maxLength={7} placeholder="7 dígitos"
                   {...form.getInputProps('codigoIbge')} />
      </Group>
    </Stack>
  )
}
