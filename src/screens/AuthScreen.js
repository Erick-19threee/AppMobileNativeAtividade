import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { formatarErroFirebase } from '../firebase/erros';
import { cores } from '../theme';

export default function TelaAutenticacao({ erroInicial, aoEntrar, aoCadastrar }) {
  const [modoCadastro, definirModoCadastro] = useState(false);
  const [nome, definirNome] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [confirmacaoSenha, definirConfirmacaoSenha] = useState('');
  const [erroFormulario, definirErroFormulario] = useState('');
  const [enviando, definirEnviando] = useState(false);

  const enviarFormulario = async () => {
    definirErroFormulario('');
    if (!email.trim() || !senha) {
      definirErroFormulario('Informe e-mail e senha.');
      return;
    }
    if (modoCadastro && !nome.trim()) {
      definirErroFormulario('Informe seu nome.');
      return;
    }
    if (modoCadastro && senha !== confirmacaoSenha) {
      definirErroFormulario('As senhas não conferem.');
      return;
    }
    if (senha.length < 6) {
      definirErroFormulario('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    definirEnviando(true);
    try {
      if (modoCadastro) {
        await aoCadastrar(nome.trim(), email.trim(), senha);
      } else {
        await aoEntrar(email.trim(), senha);
      }
    } catch (erro) {
      definirErroFormulario(formatarErroFirebase(erro));
    } finally {
      definirEnviando(false);
    }
  };

  const alternarModo = () => {
    definirErroFormulario('');
    definirModoCadastro((atual) => !atual);
  };

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView
        style={estilos.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <View style={estilos.cabecalho}>
            <Text style={estilos.marca}>nordica.</Text>
            <Text style={estilos.saudacao}>
              {modoCadastro ? 'Crie sua conta' : 'Boas-vindas'}
            </Text>
            <Text style={estilos.subtitulo}>
              {modoCadastro
                ? 'Cadastre-se para salvar seus favoritos e pedidos.'
                : 'Entre para continuar suas compras.'}
            </Text>
          </View>

          {modoCadastro ? (
            <View style={estilos.grupoCampo}>
              <Text style={estilos.rotulo}>Nome completo</Text>
              <TextInput
                value={nome}
                onChangeText={definirNome}
                placeholder="Como podemos chamar você?"
                placeholderTextColor="#99958C"
                style={estilos.campo}
                autoCapitalize="words"
                autoComplete="name"
                editable={!enviando}
              />
            </View>
          ) : null}

          <View style={estilos.grupoCampo}>
            <Text style={estilos.rotulo}>E-mail</Text>
            <TextInput
              value={email}
              onChangeText={definirEmail}
              placeholder="voce@exemplo.com"
              placeholderTextColor="#99958C"
              style={estilos.campo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!enviando}
            />
          </View>

          <View style={estilos.grupoCampo}>
            <Text style={estilos.rotulo}>Senha</Text>
            <TextInput
              value={senha}
              onChangeText={definirSenha}
              placeholder="Mínimo de 6 caracteres"
              placeholderTextColor="#99958C"
              style={estilos.campo}
              secureTextEntry
              autoComplete={modoCadastro ? 'new-password' : 'current-password'}
              textContentType={modoCadastro ? 'newPassword' : 'password'}
              editable={!enviando}
            />
          </View>

          {modoCadastro ? (
            <View style={estilos.grupoCampo}>
              <Text style={estilos.rotulo}>Confirme a senha</Text>
              <TextInput
                value={confirmacaoSenha}
                onChangeText={definirConfirmacaoSenha}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#99958C"
                style={estilos.campo}
                secureTextEntry
                editable={!enviando}
              />
            </View>
          ) : null}

          {erroInicial || erroFormulario ? (
            <View style={estilos.avisoErro}>
              <Text style={estilos.textoErro}>
                {erroFormulario || formatarErroFirebase(new Error(erroInicial))}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={enviarFormulario}
            disabled={enviando}
            style={[estilos.botaoPrincipal, enviando && estilos.botaoDesativado]}
          >
            {enviando ? (
              <ActivityIndicator color={cores.white} />
            ) : (
              <Text style={estilos.textoBotaoPrincipal}>
                {modoCadastro ? 'Criar conta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={alternarModo} disabled={enviando} style={estilos.botaoAlternativo}>
            <Text style={estilos.textoAlternativo}>
              {modoCadastro
                ? 'Já tem conta? Entrar'
                : 'Ainda não tem conta? Cadastre-se'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.cream },
  teclado: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: 28, maxWidth: 520, width: '100%', alignSelf: 'center' },
  cabecalho: { marginBottom: 28 },
  marca: { color: cores.ink, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  saudacao: { color: cores.ink, fontSize: 25, fontWeight: '800', marginTop: 32 },
  subtitulo: { color: cores.muted, fontSize: 14, marginTop: 8, lineHeight: 21 },
  grupoCampo: { marginBottom: 15 },
  rotulo: { color: cores.ink, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  campo: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.border,
    backgroundColor: cores.white,
    paddingHorizontal: 14,
    color: cores.ink,
  },
  avisoErro: { padding: 12, borderRadius: 10, backgroundColor: '#FFF0EC', marginBottom: 14 },
  textoErro: { color: '#A33A20', fontSize: 13, lineHeight: 19 },
  botaoPrincipal: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: cores.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  botaoDesativado: { opacity: 0.65 },
  textoBotaoPrincipal: { color: cores.white, fontSize: 15, fontWeight: '800' },
  botaoAlternativo: { alignItems: 'center', paddingVertical: 18 },
  textoAlternativo: { color: cores.green, fontSize: 14, fontWeight: '700' },
});
