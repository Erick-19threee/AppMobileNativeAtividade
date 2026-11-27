import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { consultarEnderecoPorCep } from '../services/viacep';
import { cores } from '../theme';
import { formatarPreco } from '../utils/formatPrice';

const ENDERECO_INICIAL = {
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  estado: '',
  numero: '',
  complemento: '',
};

function CabecalhoPagina({ aoVoltar }) {
  return (
    <View style={estilos.pageHeader}>
      <Pressable onPress={aoVoltar} style={estilos.backButton}>
        <Text style={estilos.backText}>‹</Text>
      </Pressable>
      <Text style={estilos.pageTitle}>Entrega</Text>
      <View style={estilos.trailingSpacer} />
    </View>
  );
}

function CampoEndereco({ rotulo, value, aoAlterarTexto, ...propriedadesEntrada }) {
  return (
    <>
      <Text style={estilos.fieldLabel}>{rotulo}</Text>
      <TextInput
        value={value}
        onChangeText={aoAlterarTexto}
        style={estilos.field}
        {...propriedadesEntrada}
      />
    </>
  );
}

export default function TelaFinalizacao({ carrinho, aoVoltar, aoConfirmarPedido }) {
  const [endereco, definirEndereco] = useState(ENDERECO_INICIAL);
  const [consultandoCep, definirConsultaCep] = useState(false);
  const [erroCep, definirErroCep] = useState('');
  const valorTotal = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);

  const atualizarEndereco = (campo, valor) =>
    definirEndereco((atual) => ({ ...atual, [campo]: valor }));

  const preencherEndereco = async () => {
    if (consultandoCep) return;
    definirErroCep('');
    definirConsultaCep(true);
    try {
      const dadosEndereco = await consultarEnderecoPorCep(endereco.cep);
      definirEndereco((atual) => ({ ...atual, ...dadosEndereco }));
    } catch (erro) {
      definirErroCep(erro.message || 'Falha ao consultar o CEP.');
    } finally {
      definirConsultaCep(false);
    }
  };

  const confirmarPedido = () => {
    if (!endereco.cep || !endereco.logradouro || !endereco.numero) {
      definirErroCep(
        endereco.cep
          ? 'Preencha o endereço e o número para continuar.'
          : 'Informe o CEP para continuar.'
      );
      return;
    }
    aoConfirmarPedido(endereco);
  };

  return (
    <SafeAreaView style={estilos.screen}>
      <CabecalhoPagina aoVoltar={aoVoltar} />
      <ScrollView contentContainerStyle={estilos.content} keyboardShouldPersistTaps="handled">
        <Text style={estilos.sectionTitle}>Resumo do pedido</Text>
        <View style={estilos.summary}>
          {carrinho.map((item) => (
            <View key={item.id} style={estilos.summaryRow}>
              <Text style={estilos.summaryName}>{item.quantidade}× {item.nome}</Text>
              <Text style={estilos.summaryPrice}>
                {formatarPreco(item.preco * item.quantidade)}
              </Text>
            </View>
          ))}
          <View style={estilos.summaryDivider} />
          <View style={estilos.summaryRow}>
            <Text style={estilos.summaryTotalLabel}>Total</Text>
            <Text style={estilos.summaryTotal}>{formatarPreco(valorTotal)}</Text>
          </View>
        </View>

        <Text style={estilos.sectionTitle}>Endereço de entrega</Text>
        <Text style={estilos.fieldLabel}>CEP</Text>
        <View style={estilos.cepRow}>
          <TextInput
            value={endereco.cep}
            onChangeText={(valor) =>
              atualizarEndereco('cep', valor.replace(/\D/g, '').slice(0, 8))
            }
            placeholder="00000-000"
            placeholderTextColor="#99958C"
            keyboardType="number-pad"
            style={[estilos.field, estilos.cepField]}
          />
          <Pressable
            onPress={preencherEndereco}
            disabled={consultandoCep}
            style={[estilos.cepButton, consultandoCep && estilos.cepButtonDisabled]}
          >
            {consultandoCep ? (
              <ActivityIndicator color={cores.white} />
            ) : (
              <Text style={estilos.cepButtonText}>Buscar</Text>
            )}
          </Pressable>
        </View>
        {erroCep ? (
          <View style={estilos.errorBox}>
            <Text style={estilos.errorText}>{erroCep}</Text>
            <Pressable onPress={preencherEndereco}>
              <Text style={estilos.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <CampoEndereco
          rotulo="Rua"
          value={endereco.logradouro}
          aoAlterarTexto={(valor) => atualizarEndereco('logradouro', valor)}
        />
        <View style={estilos.addressRow}>
          <View style={estilos.addressNumber}>
            <CampoEndereco
              rotulo="Número"
              value={endereco.numero}
              aoAlterarTexto={(valor) => atualizarEndereco('numero', valor)}
              keyboardType="number-pad"
            />
          </View>
          <View style={estilos.addressComplement}>
            <CampoEndereco
              rotulo="Complemento"
              value={endereco.complemento}
              aoAlterarTexto={(valor) => atualizarEndereco('complemento', valor)}
            />
          </View>
        </View>
        <CampoEndereco
          rotulo="Bairro"
          value={endereco.bairro}
          aoAlterarTexto={(valor) => atualizarEndereco('bairro', valor)}
        />
        <View style={estilos.addressRow}>
          <View style={estilos.addressCity}>
            <CampoEndereco
              rotulo="Cidade"
              value={endereco.cidade}
              aoAlterarTexto={(valor) => atualizarEndereco('cidade', valor)}
            />
          </View>
          <View style={estilos.addressState}>
            <CampoEndereco
              rotulo="Estado"
              value={endereco.estado}
              aoAlterarTexto={(valor) =>
                atualizarEndereco('estado', valor.toUpperCase().slice(0, 2))
              }
              autoCapitalize="characters"
            />
          </View>
        </View>
        <Pressable onPress={confirmarPedido} style={[estilos.primaryButton, estilos.checkoutButton]}>
          <Text style={estilos.primaryButtonText}>Confirmar pedido</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.cream },
  pageHeader: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.white,
  },
  backText: { fontSize: 31, lineHeight: 34, color: cores.ink },
  pageTitle: { color: cores.ink, fontSize: 18, fontWeight: '800' },
  trailingSpacer: { width: 40 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: cores.ink, fontSize: 17, fontWeight: '800', marginBottom: 10 },
  summary: { backgroundColor: cores.white, borderRadius: 14, padding: 14, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  summaryName: { flex: 1, color: cores.muted, fontSize: 13 },
  summaryPrice: { color: cores.ink, fontSize: 13, fontWeight: '700' },
  summaryDivider: { height: 1, backgroundColor: cores.border, marginVertical: 8 },
  summaryTotalLabel: { color: cores.ink, fontSize: 15, fontWeight: '800' },
  summaryTotal: { color: cores.orange, fontSize: 16, fontWeight: '800' },
  fieldLabel: { color: cores.ink, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  field: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.border,
    backgroundColor: cores.white,
    paddingHorizontal: 12,
    color: cores.ink,
    marginBottom: 12,
  },
  cepRow: { flexDirection: 'row', gap: 8 },
  cepField: { flex: 1 },
  cepButton: {
    width: 92,
    height: 48,
    borderRadius: 10,
    backgroundColor: cores.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cepButtonDisabled: { opacity: 0.65 },
  cepButtonText: { color: cores.white, fontSize: 13, fontWeight: '800' },
  errorBox: { backgroundColor: '#FFF0EC', borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { color: '#A33A20', fontSize: 13 },
  retryText: { color: '#A33A20', fontSize: 12, fontWeight: '800', marginTop: 5 },
  addressRow: { flexDirection: 'row', gap: 10 },
  addressNumber: { width: 100 },
  addressComplement: { flex: 1 },
  addressCity: { flex: 1 },
  addressState: { width: 74 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: cores.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButton: { marginTop: 8 },
  primaryButtonText: { color: cores.white, fontSize: 15, fontWeight: '800' },
});
