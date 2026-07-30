import { useState } from 'react'
import {
  TextInput, Select, Chip, Group, Stack, Text, Button, Accordion, Badge,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { api } from '../api'
import { formatDocument } from '../lib/format'
import { PAPEIS, CONTRIBUINTES } from '../lib/pessoa'
import { enderecoDaResposta, enderecoParaApi, faltaNoEndereco } from '../lib/endereco'
import { CamposEndereco } from './CamposEndereco'

/**
 * Edição de pessoa já cadastrada.
 *
 * Documento e tipo não aparecem como campos: são a identidade da pessoa, e a
 * API não os aceita na atualização. Trocar o documento de um cadastro que já
 * está em notas e pedidos transformaria silenciosamente um terceiro em outro.
 *
 * Papéis vão no mesmo PUT — o backend reconcilia a lista (adiciona o que falta,
 * remove o que sobra) numa transação só, em vez de o front disparar uma chamada
 * por papel e poder parar no meio.
 *
 * aoSalvar recebe o PessoaResposta atualizado.
 */
export function FormEditarPessoa({ pessoa, aoSalvar }) {
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: {
      nome: pessoa.nome,
      nomeFantasia: pessoa.nomeFantasia ?? '',
      papeis: pessoa.papeis ?? [],
      email: pessoa.email ?? '',
      telefone: pessoa.telefone ?? '',
      inscricaoEstadual: pessoa.inscricaoEstadual ?? '',
      inscricaoMunicipal: pessoa.inscricaoMunicipal ?? '',
      contribuinteIcms: pessoa.contribuinteIcms ?? 'NAO_CONTRIBUINTE',
      ...enderecoDaResposta(pessoa.enderecos),
    },
    validate: {
      nome: (v) => (v.trim() ? null : 'Informe o nome'),
      papeis: (v) => (v.length ? null : 'Selecione ao menos um papel'),
    },
  })

  async function enviar(values) {
    const problema = faltaNoEndereco(values)
    if (problema) return notifications.show({ color: 'red', message: problema })

    setEnviando(true)
    try {
      const atualizada = await api.put(`/pessoas/${pessoa.id}`, {
        nome: values.nome,
        nomeFantasia: values.nomeFantasia || null,
        papeis: values.papeis,
        inscricaoEstadual: values.inscricaoEstadual || null,
        inscricaoMunicipal: values.inscricaoMunicipal || null,
        contribuinteIcms: values.contribuinteIcms,
        email: values.email || null,
        telefone: values.telefone || null,
        endereco: enderecoParaApi(values),
      })
      notifications.show({ color: 'green', message: `${values.nome} atualizado(a).` })
      aoSalvar(atualizada)
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
          <TextInput label="CPF / CNPJ" value={formatDocument(pessoa.documento)} disabled
                     description="Identidade do cadastro — não pode ser alterada" />
          <TextInput label="Tipo" value={pessoa.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                     disabled />
        </Group>
        <TextInput label="Nome / Razão social" withAsterisk data-autofocus
                   {...form.getInputProps('nome')} />
        <Group grow align="flex-start">
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
          <Text size="xs" c="dimmed" mt={4}>
            Desmarcar remove o papel. Tirar “Cliente” de quem já tem pedido faz a
            edição desse pedido passar a recusar — o pedido continua lá, mas não abre
            para alteração.
          </Text>
        </div>

        <Accordion multiple defaultValue={['endereco']} variant="contained">
          <Accordion.Item value="endereco">
            <Accordion.Control>
              <Group gap="xs">
                Endereço
                {!pessoa.enderecos?.length && (
                  <Badge size="sm" variant="light" color="yellow">não informado</Badge>
                )}
              </Group>
            </Accordion.Control>
            <Accordion.Panel><CamposEndereco form={form} /></Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="fiscal">
            <Accordion.Control>Dados fiscais</Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <Group grow align="flex-start">
                  <TextInput label="Inscrição estadual" {...form.getInputProps('inscricaoEstadual')} />
                  <TextInput label="Inscrição municipal" {...form.getInputProps('inscricaoMunicipal')} />
                </Group>
                <Select label="Contribuinte de ICMS" data={CONTRIBUINTES} allowDeselect={false}
                        description="Define destaque de ICMS e substituição tributária na NF-e"
                        {...form.getInputProps('contribuinteIcms')} />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group justify="flex-end" mt="sm">
          <Button type="submit" loading={enviando}>Salvar alterações</Button>
        </Group>
      </Stack>
    </form>
  )
}
