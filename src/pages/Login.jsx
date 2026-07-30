import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Card, TextInput, PasswordInput, Button, Title, Text, Stack, Center, Alert, Group,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { api } from '../api'
import { setSessao } from '../sessao'

export default function Login({ aoEntrar }) {
  const navigate = useNavigate()
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const form = useForm({
    initialValues: { email: '', senha: '' },
    validate: {
      email: (v) => (v.trim() ? null : 'Informe o e-mail'),
      senha: (v) => (v ? null : 'Informe a senha'),
    },
  })

  async function enviar(values) {
    setErro(null)
    setEnviando(true)
    try {
      const sessao = await api.login({ email: values.email.trim(), senha: values.senha })
      setSessao(sessao)
      aoEntrar?.(sessao)
      navigate('/')
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Center mih="100vh" p="md">
      <Card withBorder padding="xl" w="100%" maw={420} shadow="sm">
        <Title order={2} ta="center">
          Gerencie<Text span c="blue" inherit>Já</Text>
        </Title>
        <Text c="dimmed" ta="center" mb="lg">Entre com sua conta</Text>

        <form onSubmit={form.onSubmit(enviar)}>
          <Stack>
            {erro && <Alert color="red" py="xs">{erro}</Alert>}
            <TextInput label="E-mail" withAsterisk type="email" data-autofocus
                       placeholder="voce@empresa.com.br"
                       {...form.getInputProps('email')} />
            <PasswordInput label="Senha" withAsterisk
                           {...form.getInputProps('senha')} />
            <Button type="submit" loading={enviando} mt="sm">Entrar</Button>
          </Stack>
        </form>

        <Group justify="center" mt="lg" gap={6}>
          <Text size="sm" c="dimmed">Ainda não tem empresa cadastrada?</Text>
          <Text size="sm" component={Link} to="/onboarding" c="blue" fw={500}>
            Cadastrar
          </Text>
        </Group>
      </Card>
    </Center>
  )
}
