import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

export default function EstadoVazio({
  icone,
  titulo,
  mensagem,
  rotuloAcao,
  aoAcionar,
}) {
  return (
    <View style={estilos.container}>
      <Text style={estilos.glyph}>{icone}</Text>
      <Text style={estilos.title}>{titulo}</Text>
      <Text style={estilos.message}>{mensagem}</Text>
      {rotuloAcao && aoAcionar ? (
        <Pressable onPress={aoAcionar} style={estilos.button}>
          <Text style={estilos.buttonText}>{rotuloAcao}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  glyph: { fontSize: 38, color: cores.muted, marginBottom: 12 },
  title: { color: cores.ink, fontSize: 20, fontWeight: '800' },
  message: { color: cores.muted, fontSize: 14, marginTop: 8, textAlign: 'center' },
  button: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.ink,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: { color: cores.ink, fontWeight: '800' },
});
