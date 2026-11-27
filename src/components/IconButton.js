import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../theme';

export default function BotaoIcone({ rotulo, children, aoPressionar, ativo = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.button,
        ativo && estilos.active,
        pressed && estilos.pressed,
      ]}
    >
      <Text style={[estilos.text, ativo && estilos.activeText]}>{children}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: cores.orange },
  pressed: { opacity: 0.65 },
  text: { color: cores.ink, fontSize: 17, lineHeight: 20 },
  activeText: { color: cores.white },
});
