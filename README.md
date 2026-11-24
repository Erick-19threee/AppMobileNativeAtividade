# Consulta de CEP — React Native

Aplicativo mobile simples para consultar endereços pelo CEP usando a API pública [ViaCEP](https://viacep.com.br/). O projeto não usa DummyJSON, catálogo de produtos nem imagens.

## Funcionalidades

- Campo para digitar um CEP, com formatação `00000-000`.
- Consulta de endereço pela API ViaCEP.
- Exibição de logradouro, bairro, cidade, estado e complemento quando disponível.
- Validação de CEP, indicador de carregamento e mensagens de erro.

## Executar

Crie um projeto no [Expo Snack](https://snack.expo.dev/) com o template React Native, substitua o conteúdo de `App.js` pelo exemplo abaixo e execute no Snack ou Expo Go. Não é necessário instalar dependências adicionais.

```jsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function formatarCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5
    ? `${digits.slice(0, 5)}-${digits.slice(5)}`
    : digits;
}

export default function App() {
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function consultarCep() {
    const digits = cep.replace(/\D/g, '');
    setEndereco(null);
    setErro('');

    if (digits.length !== 8) {
      setErro('Digite um CEP com 8 números.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) {
        throw new Error('Não foi possível consultar o CEP. Tente novamente.');
      }

      const data = await response.json();
      if (data.erro) {
        setErro('CEP não encontrado. Confira os números e tente novamente.');
        return;
      }

      setEndereco(data);
    } catch (error) {
      setErro(error.message || 'Falha de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Consulta de CEP</Text>
      <Text style={styles.subtitle}>Encontre um endereço pelo código postal.</Text>

      <TextInput
        style={styles.input}
        value={cep}
        onChangeText={(value) => setCep(formatarCep(value))}
        placeholder="00000-000"
        keyboardType="numeric"
        maxLength={9}
        accessibilityLabel="CEP"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={consultarCep}
        disabled={loading}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Consultando...' : 'Consultar'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />}
      {!!erro && <Text style={styles.error}>{erro}</Text>}

      {endereco && (
        <View style={styles.card}>
          <Text style={styles.addressTitle}>Endereço encontrado</Text>
          <Text style={styles.addressLine}>CEP: {endereco.cep}</Text>
          <Text style={styles.addressLine}>Logradouro: {endereco.logradouro || 'Não informado'}</Text>
          <Text style={styles.addressLine}>Complemento: {endereco.complemento || 'Não informado'}</Text>
          <Text style={styles.addressLine}>Bairro: {endereco.bairro || 'Não informado'}</Text>
          <Text style={styles.addressLine}>Cidade: {endereco.localidade || 'Não informada'}</Text>
          <Text style={styles.addressLine}>Estado: {endereco.uf || 'Não informado'}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    justifyContent: 'center',
  },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#475569', fontSize: 16, marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 18,
    padding: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    marginTop: 12,
    padding: 15,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loading: { marginTop: 20 },
  error: { color: '#b91c1c', fontSize: 15, marginTop: 18 },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    padding: 18,
  },
  addressTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  addressLine: { color: '#334155', fontSize: 15, marginTop: 5 },
});
```

## API

A consulta usa o endpoint `https://viacep.com.br/ws/{CEP}/json/`. Envie somente os oito dígitos. Para um CEP válido inexistente, a API retorna um campo `erro: true`; por isso o app verifica esse campo além do status HTTP.

## Testes manuais

- Consultar um CEP válido, por exemplo `01001-000`.
- Digitar menos ou mais de oito números e conferir a validação.
- Consultar um CEP inválido/inexistente.
- Testar sem conexão e confirmar que o app exibe uma mensagem de erro.
- Confirmar que campos ausentes aparecem como “Não informado”.

## Referência

- [Documentação da API ViaCEP](https://viacep.com.br/)
- [Expo Snack](https://snack.expo.dev/)
